import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Stage, Layer, Image, Rect, Circle, Arrow, Line } from 'react-konva';

// Your deployed backend URL
const apiUrl = 'https://oral-health-screening-portal.onrender.com';

// Helper function to convert a Base64 data URL to a File object for upload
const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
};

const AnnotationPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const stageRef = useRef(null);

    // --- STATE MANAGEMENT ---
    const [submission, setSubmission] = useState(null);
    const [imageElement, setImageElement] = useState(null);
    const [tool, setTool] = useState('rect');
    const [shapes, setShapes] = useState([]); // Shapes for the CURRENTLY selected image
    const [isDrawing, setIsDrawing] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // Unified legend for the whole submission
    const [legends, setLegends] = useState([]);
    const [currentColor, setCurrentColor] = useState('#FF0000');
    const [currentLegendText, setCurrentLegendText] = useState('');

    // URL of the image currently being annotated
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${apiUrl}/api/submissions/${id}`, { headers: { 'x-auth-token': token } });
                setSubmission(res.data);
                if (res.data.legends) {
                    setLegends(res.data.legends);
                }
                if (res.data.originalImageUrls && res.data.originalImageUrls.length > 0) {
                    handleImageSelect(res.data.originalImageUrls[0], res.data.annotations);
                }
            } catch (err) { setError('Failed to fetch submission details.'); }
        };
        fetchSubmission();
    }, [id]);

    useEffect(() => {
        if (selectedImage) {
            const img = new window.Image();
            // CORRECT: Use the full S3 URL directly
            img.src = selectedImage;
            img.crossOrigin = 'Anonymous'; // Required for Konva to export the image
            img.onload = () => setImageElement(img);
        }
    }, [selectedImage]);

    // Function to switch between images
    const handleImageSelect = (imageUrl, allAnnotations) => {
        setSelectedImage(imageUrl);
        const currentAnnotations = allAnnotations || (submission ? submission.annotations : []);
        const existingAnnotation = currentAnnotations.find(ann => ann.originalUrl === imageUrl);
        setShapes(existingAnnotation?.annotationData?.shapes || []);
    };

    // Function to add a new category to the unified legend
    const handleAddLegend = () => {
        if (currentLegendText.trim() && !legends.find(l => l.color === currentColor)) {
            setLegends([...legends, { color: currentColor, text: currentLegendText }]);
            setCurrentLegendText('');
        }
    };

    // Drawing event handlers
    const handleMouseDown = (e) => {
        setIsDrawing(true);
        const pos = e.target.getStage().getPointerPosition();
        const newShape = { id: `shape-${shapes.length}`, type: tool, color: currentColor, points: [pos.x, pos.y], x: pos.x, y: pos.y, width: 0, height: 0 };
        setShapes([...shapes, newShape]);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        let lastShape = { ...shapes[shapes.length - 1] };

        if (lastShape.type === 'arrow') {
            lastShape.points = [lastShape.points[0], lastShape.points[1], pos.x, pos.y];
        } else {
            lastShape.width = pos.x - lastShape.x;
            lastShape.height = pos.y - lastShape.y;
        }
        setShapes([...shapes.slice(0, -1), lastShape]);
    };

    const handleMouseUp = () => setIsDrawing(false);

    // Function to save the annotation for the CURRENT image
    const handleSave = async () => {
        if (!selectedImage) return setError("No image selected to annotate.");
        setError('');
        setMessage('Saving annotation...');
        try {
            const dataURL = stageRef.current.toDataURL({ pixelRatio: 1 });
            const formData = new FormData();
            formData.append('annotatedImage', dataURLtoFile(dataURL, 'annotated-image.png'));
            formData.append('shapes', JSON.stringify(shapes));
            formData.append('legends', JSON.stringify(legends)); // Send the unified legend
            formData.append('originalImageUrl', selectedImage);

            const token = localStorage.getItem('token');
            const res = await axios.put(`${apiUrl}/api/submissions/${id}/annotate`, formData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
            });
            setMessage(`Annotation for the current image saved successfully!`);
            setSubmission(res.data);
        } catch (err) { setError('Failed to save annotation.'); setMessage(''); }
    };

    // Function to generate the final report for the ENTIRE submission
    const handleGenerateReport = async () => {
        if (submission.annotations.length < submission.originalImageUrls.length) {
             return setError("Please save an annotation for all uploaded images before generating the report.");
        }
        setMessage('Generating report...');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/api/submissions/${id}/generate-report`, {}, { headers: { 'x-auth-token': token } });
            setMessage('Report generated successfully! Redirecting...');
            setTimeout(() => navigate('/admin'), 2000);
        } catch (err) { setError('Failed to generate report.'); setMessage(''); }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h1 style={styles.cardTitle}>Annotate Submission</h1>
                {error && <p style={styles.errorMessage}>{error}</p>}
                {message && <p style={styles.successMessage}>{message}</p>}

                <div style={styles.legendCreator}>
                    <input type="color" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} style={{height: '40px', cursor: 'pointer'}} />
                    <input
                        type="text"
                        placeholder="Define Annotation Type (e.g., Caries, Stain)"
                        value={currentLegendText}
                        onChange={(e) => setCurrentLegendText(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={handleAddLegend} style={styles.button}>Add to Legend</button>
                </div>
                <div style={styles.legendDisplay}>
                    <strong>Report Legend: </strong>
                    {legends.map(l => (
                        <span key={l.color} style={{ marginRight: '20px' }}>
                            <span style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: l.color, marginRight: '8px', verticalAlign: 'middle', border: '1px solid #ccc' }}></span>
                            {l.text}
                        </span>
                    ))}
                </div>

                <div style={styles.thumbnailContainer}>
                    {submission?.originalImageUrls.map(url => (
                        <img
                            key={url}
                            src={url} // CORRECT: Use the S3 URL directly
                            alt="thumbnail"
                            style={selectedImage === url ? styles.thumbnailSelected : styles.thumbnail}
                            onClick={() => handleImageSelect(url, submission.annotations)}
                        />
                    ))}
                </div>

                <div style={styles.toolbar}>
                    <label style={{fontWeight: 'bold'}}>Tool:</label>
                    <select onChange={(e) => setTool(e.target.value)} value={tool} style={styles.toolSelect}>
                        <option value="rect">Rectangle</option>
                        <option value="circle">Circle</option>
                        <option value="arrow">Arrow</option>
                    </select>
                    <button onClick={() => setShapes(shapes.slice(0, -1))} style={{...styles.button, backgroundColor: '#6c757d'}}>Undo Last Shape</button>
                </div>

                <div style={styles.canvasContainer}>
                     {imageElement ? (
                        <Stage
                            width={imageElement.width}
                            height={imageElement.height}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            ref={stageRef}
                        >
                            <Layer>
                                <Image image={imageElement} />
                                {shapes.map(shape => {
                                    if (shape.type === 'rect') return <Rect key={shape.id} x={shape.x} y={shape.y} width={shape.width} height={shape.height} stroke={shape.color} strokeWidth={4} />;
                                    if (shape.type === 'circle') return <Circle key={shape.id} x={shape.x + shape.width/2} y={shape.y + shape.height/2} radius={Math.max(Math.abs(shape.width), Math.abs(shape.height)) / 2} stroke={shape.color} strokeWidth={4} />;
                                    if (shape.type === 'arrow') return <Arrow key={shape.id} points={shape.points} stroke={shape.color} strokeWidth={4} fill={shape.color} />;
                                    return null;
                                })}
                            </Layer>
                        </Stage>
                    ) : <p>Select an image to begin annotation.</p>}
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
                    <button onClick={handleSave} style={{...styles.button, flex: 1}}>Save Annotation for This Image</button>
                    <button onClick={handleGenerateReport} style={{...styles.button, flex: 1, backgroundColor: '#28a745'}}>Generate Final Report</button>
                </div>
            </div>
        </div>
    );
};

// Professional styles
const styles = {
    page: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', padding: '20px' },
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    cardTitle: { marginTop: 0, marginBottom: '20px' },
    legendCreator: { display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' },
    legendDisplay: { marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' },
    thumbnailContainer: { display: 'flex', gap: '10px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e9ecef', flexWrap: 'wrap' },
    thumbnail: { height: '100px', width: '100px', objectFit: 'cover', cursor: 'pointer', border: '3px solid transparent', borderRadius: '5px' },
    thumbnailSelected: { height: '100px', width: '100px', objectFit: 'cover', cursor: 'pointer', border: '3px solid #007bff', borderRadius: '5px' },
    toolbar: { marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' },
    toolSelect: { padding: '8px', borderRadius: '5px', border: '1px solid #ced4da' },
    canvasContainer: { border: '1px solid #ccc', display: 'inline-block', lineHeight: 0, background: '#f8f9fa' },
    button: { padding: '10px 18px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    input: { padding: '10px', borderRadius: '5px', border: '1px solid #ced4da', flex: 1 },
    errorMessage: { color: '#dc3545', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px', border: '1px solid #f5c6cb' },
    successMessage: { color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', border: '1px solid #c3e6cb' }
};

export default AnnotationPage;