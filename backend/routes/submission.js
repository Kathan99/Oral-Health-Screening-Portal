const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { authorize } = require('../middleware/auth');
const Submission = require('../models/Submission');

const router = express.Router();

// --- Multer Configuration ---
// This part is crucial. It defines our file upload middleware.
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `submission-${Date.now()}${path.extname(file.originalname)}`)
});

// --- FIX: Define `multiUpload` and `singleUpload` here, before they are used ---
const multiUpload = multer({ storage: storage }).array('images', 5);
const singleUpload = multer({ storage: storage }).single('annotatedImage');


// @route   POST /api/submissions (Patient upload)
// @desc    Patient uploads one or more images
// @access  Private (Patient)
router.post('/', authorize('patient'), multiUpload, async (req, res) => {
    const { name, email, note } = req.body;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ msg: 'Please upload at least one image' });
    }
    try {
        const imageUrls = req.files.map(file => file.path);
        const newSubmission = new Submission({
            patientId: req.user.id,
            name,
            email,
            note,
            originalImageUrls: imageUrls
        });
        const submission = await newSubmission.save();
        res.json(submission);
    } catch (err) {
        console.error("Error in POST /api/submissions:", err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/submissions/:id/annotate
// @desc    Admin saves annotation for one image and the overall legend
// @access  Private (Admin)
router.put('/:id/annotate', authorize('admin'), singleUpload, async (req, res) => {
    const { shapes, legends, originalImageUrl } = req.body;
    if (!req.file || !shapes || !legends || !originalImageUrl) {
        return res.status(400).json({ msg: 'Annotated image, shapes, legends, and original URL are required.' });
    }

    try {
        let submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ msg: 'Submission not found' });

        submission.legends = JSON.parse(legends);

        const annotationIndex = submission.annotations.findIndex(ann => ann.originalUrl === originalImageUrl);
        const newAnnotation = {
            originalUrl: originalImageUrl,
            annotatedImageUrl: req.file.path,
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
    } catch (err) {
        console.error("Error in PUT /annotate:", err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/submissions/:id/generate-report
// @desc    Admin generates the final PDF report with a grid layout
// @access  Private (Admin)
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
        currentY -= 200;

        const images = submission.annotations;
        if (images.length > 0) {
            const imageMargin = 20;
            const availableWidth = width - 100 - ((images.length - 1) * imageMargin);
            const imageWidth = availableWidth / images.length;
    
            for (let i = 0; i < images.length; i++) {
                const annotation = images[i];
                const imagePath = path.join(__dirname, '..', annotation.annotatedImageUrl);
                if (fs.existsSync(imagePath)) {
                    const imageBytes = fs.readFileSync(imagePath);
                    const pngImage = await pdfDoc.embedPng(imageBytes);
                    const scaled = pngImage.scaleToFit(imageWidth, 150);
                    
                    const xPos = 50 + i * (imageWidth + imageMargin);
                    page.drawImage(pngImage, {
                        x: xPos,
                        y: currentY,
                        width: scaled.width,
                        height: scaled.height,
                    });
                }
            }
        }
        currentY -= 40;

        const legends = submission.legends || [];
        if (legends.length > 0) {
            let legendX = 50;
            legends.forEach(({ color, text }) => {
                const r = parseInt(color.slice(1, 3), 16) / 255;
                const g = parseInt(color.slice(3, 5), 16) / 255;
                const b = parseInt(color.slice(5, 7), 16) / 255;

                page.drawRectangle({ x: legendX, y: currentY, width: 12, height: 12, color: rgb(r, g, b) });
                page.drawText(text, { x: legendX + 20, y: currentY + 1, font, size: 10 });
                
                legendX += 100;
            });
        }

        const pdfBytes = await pdfDoc.save();
        const reportDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);
        const reportPath = `reports/report-${submission._id}.pdf`;
        fs.writeFileSync(path.join(__dirname, '..', reportPath), pdfBytes);

        submission.reportUrl = reportPath;
        submission.status = 'reported';
        await submission.save();
        res.json(submission);

    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// --- Other GET routes remain unchanged ---
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