const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { authorize } = require('../middleware/auth');
const Submission = require('../models/Submission');

const router = express.Router();


const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const storage = multer.memoryStorage();
const multiUpload = multer({ storage: storage }).array('images', 5);
const singleUpload = multer({ storage: storage }).single('annotatedImage');


const uploadToS3 = async (fileBuffer, fileName, mimetype) => {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `uploads/${fileName}`, 
        Body: fileBuffer,
        ContentType: mimetype,
        ACL: 'public-read' 
    });
    await s3.send(command);

    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${fileName}`;
};


router.post('/', authorize('patient'), multiUpload, async (req, res) => {
    const { name, email, note } = req.body;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ msg: 'Please upload at least one image' });
    }
    try {
        const imageUrls = [];
        for (const file of req.files) {
            const fileName = `submission-${Date.now()}-${file.originalname}`;
            const s3Url = await uploadToS3(file.buffer, fileName, file.mimetype);
            imageUrls.push(s3Url);
        }
        const newSubmission = new Submission({
            patientId: req.user.id, name, email, note, originalImageUrls: imageUrls
        });
        const submission = await newSubmission.save();
        res.json(submission);
    } catch (err) { console.error("S3 Upload Error:", err); res.status(500).send('Server Error'); }
});

router.put('/:id/annotate', authorize('admin'), singleUpload, async (req, res) => {
    const { shapes, legends, originalImageUrl } = req.body;
    if (!req.file || !shapes || !legends || !originalImageUrl) {
        return res.status(400).json({ msg: 'Annotated image, shapes, legends, and original URL are required.' });
    }
    try {
        const fileName = `annotated-${Date.now()}.png`;
        const s3Url = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);

        let submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ msg: 'Submission not found' });

        submission.legends = JSON.parse(legends);

        const annotationIndex = submission.annotations.findIndex(ann => ann.originalUrl === originalImageUrl);
        const newAnnotation = {
            originalUrl: originalImageUrl,
            annotatedImageUrl: s3Url,
            annotationData: { shapes: JSON.parse(shapes) }
        };

        if (annotationIndex > -1) {
            submission.annotations[annotationIndex] = newAnnotation;
        } else {
            submission.annotations.push(newAnnotation);
        }
        submission.status = 'annotated';
        await submission.save();
        res.json(submission);
    } catch (err) { console.error("Annotate Error:", err); res.status(500).send('Server Error'); }
});


router.post('/:id/generate-report', authorize('admin'), async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission || submission.status !== 'annotated') {
            return res.status(400).json({ msg: 'Submission not found or not yet annotated' });
        }
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        let currentY = height - 50;

        
        page.drawText('Oral Health Screening Report', { x: 50, y: currentY, font: boldFont, size: 24 });
        currentY -= 40;
        const details = [`Name: ${submission.name}`, `Email: ${submission.email}`, `Date: ${new Date(submission.createdAt).toLocaleDateString()}`];
        details.forEach(line => { page.drawText(line, { x: 50, y: currentY, font, size: 12 }); currentY -= 20; });
        currentY -= 20;
        page.drawText('SCREENING REPORT:', { x: 50, y: currentY, font: boldFont, size: 16 });
        currentY -= 220; 

     
        const images = submission.annotations;
        if (images.length > 0) {
            const imageMargin = 20;
            const availableWidth = width - 100 - ((images.length - 1) * imageMargin);
            const imageWidth = availableWidth / Math.min(images.length, 3); 

            for (let i = 0; i < images.length; i++) {
                const annotation = images[i];
                try {
                    const imageResponse = await axios.get(annotation.annotatedImageUrl, { responseType: 'arraybuffer' });
                    const imageBytes = imageResponse.data;
                    const pngImage = await pdfDoc.embedPng(imageBytes);
                    const scaled = pngImage.scaleToFit(imageWidth, 180);
                    const xPos = 50 + i * (imageWidth + imageMargin);
                    page.drawImage(pngImage, { x: xPos, y: currentY, width: scaled.width, height: scaled.height });
                } catch (imgErr) { console.error(`Failed to embed image from ${annotation.annotatedImageUrl}`); }
            }
        }
        currentY -= 40;

        const legends = submission.legends || [];
        if (legends.length > 0) {
            let legendX = 50;
            legends.forEach(({ color, text }) => {
                const [r,g,b] = [parseInt(color.slice(1,3),16)/255, parseInt(color.slice(3,5),16)/255, parseInt(color.slice(5,7),16)/255];
                page.drawRectangle({ x: legendX, y: currentY, width: 12, height: 12, color: rgb(r, g, b) });
                page.drawText(text, { x: legendX + 20, y: currentY + 1, font, size: 10 });
                legendX += 120;
                if (legendX > width - 100) { 
                    legendX = 50;
                    currentY -= 20;
                }
            });
        }


        const pdfBytes = await pdfDoc.save();
        const reportFileName = `report-${submission._id}-${Date.now()}.pdf`;
        const reportS3Url = await uploadToS3(pdfBytes, reportFileName, 'application/pdf');

   
        submission.reportUrl = reportS3Url;
        submission.status = 'reported';
        await submission.save();
        res.json(submission);
    } catch (err) { console.error("Report Generation Error:", err); res.status(500).send('Server Error'); }
});


router.get('/patient', authorize('patient'), async (req, res) => {
    try {
        const submissions = await Submission.find({ patientId: req.user.id }).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});
router.get('/', authorize('admin'), async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});
router.get('/:id', authorize('admin'), async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ msg: 'Submission not found' });
        res.json(submission);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

module.exports = router;