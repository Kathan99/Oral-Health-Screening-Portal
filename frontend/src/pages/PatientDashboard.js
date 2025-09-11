import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Your deployed backend URL
const apiUrl = 'https://oral-health-screening-portal.onrender.com';

const PatientDashboard = () => {
    const [formData, setFormData] = useState({ name: '', email: '', note: '', images: [] });
    const [submissions, setSubmissions] = useState([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${apiUrl}/api/submissions/patient`, {
                    headers: { 'x-auth-token': token }
                });
                setSubmissions(res.data);
            } catch (err) { setError('Failed to fetch submissions.'); }
        };
        fetchSubmissions();
    }, []);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onFileChange = e => setFormData({ ...formData, images: e.target.files });

    const onSubmit = async e => {
        e.preventDefault();
        setUploading(true);
        setError('');
        setMessage('');

        const submissionData = new FormData();
        submissionData.append('name', formData.name);
        submissionData.append('email', formData.email);
        submissionData.append('note', formData.note);
        for (let i = 0; i < formData.images.length; i++) {
            submissionData.append('images', formData.images[i]);
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${apiUrl}/api/submissions`, submissionData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Submission successful! Your record has been added below.');
            setSubmissions([res.data, ...submissions]);
            // Reset form for the next submission
            setFormData({ name: '', email: '', note: '', images: [] });
            document.getElementById('file-input').value = "";
        } catch (err) {
            setError(err.response?.data?.msg || 'Submission failed. Please check your files and try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const StatusBadge = ({ status }) => {
        const style = {
            padding: '4px 10px',
            borderRadius: '12px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            backgroundColor: '#6c757d' // Default grey for 'annotated'
        };

        if (status === 'uploaded') {
            style.backgroundColor = '#ffc107'; // Yellow
            style.color = '#333';
        } else if (status === 'reported') {
            style.backgroundColor = '#28a745'; // Green
        }
        return <span style={style}>{status}</span>;
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1>Patient Dashboard</h1>
                <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
            </div>
            
            <div style={styles.dashboardLayout}>
                {/* Left Column: New Submission Form */}
                <div style={{ ...styles.card, flex: 1 }}>
                    <h2 style={styles.cardTitle}>New Submission</h2>
                    <p style={styles.cardSubtitle}>Fill out the form below and upload your images for review.</p>
                    
                    {error && <p style={styles.errorMessage}>{error}</p>}
                    {message && <p style={styles.successMessage}>{message}</p>}

                    <form onSubmit={onSubmit}>
                        <label style={styles.label}>Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={onChange} required style={styles.input} />

                        <label style={styles.label}>Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={onChange} required style={styles.input} />

                        <label style={styles.label}>Additional Notes (Optional)</label>
                        <textarea name="note" value={formData.note} onChange={onChange} style={styles.textarea}></textarea>

                        <label style={styles.label}>Upload Images (up to 5)</label>
                        <input type="file" name="images" id="file-input" onChange={onFileChange} required multiple style={styles.input} />

                        <button type="submit" style={uploading ? styles.buttonDisabled : styles.button} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Submit for Review'}
                        </button>
                    </form>
                </div>

                {/* Right Column: Submission History */}
                <div style={{ ...styles.card, flex: 2 }}>
                    <h2 style={styles.cardTitle}>Your Submission History</h2>
                    {submissions.length > 0 ? (
                        <ul style={styles.list}>
                            {submissions.map(sub => (
                                <li key={sub._id} style={styles.listItem}>
                                    <div style={{ flex: 1 }}>
                                        <p style={styles.listDate}>{new Date(sub.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p style={styles.listNote}>Note: {sub.note || 'N/A'}</p>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <StatusBadge status={sub.status} />
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                        {sub.status === 'reported' && sub.reportUrl ? (
                                            <a 
                                                href={sub.reportUrl} // CORRECT: Use the S3 URL directly
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                style={styles.downloadLink}
                                            >
                                                Download Report
                                            </a>
                                        ) : (
                                            <span style={styles.noReport}>Report Not Ready</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>You have no previous submissions.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Professional CSS-in-JS Styles ---
const styles = {
    page: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    logoutButton: { padding: '10px 18px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    dashboardLayout: { display: 'flex', gap: '30px', flexDirection: 'column', '@media (min-width: 768px)': { flexDirection: 'row' } },
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    cardTitle: { marginTop: 0, marginBottom: '5px' },
    cardSubtitle: { color: '#6c757d', fontSize: '14px', marginTop: 0, marginBottom: '20px' },
    label: { display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' },
    input: { display: 'block', width: 'calc(100% - 22px)', padding: '11px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ced4da' },
    textarea: { display: 'block', width: 'calc(100% - 22px)', minHeight: '80px', padding: '11px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ced4da' },
    button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.2s' },
    buttonDisabled: { width: '100%', padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'not-allowed', fontWeight: 'bold', fontSize: '16px' },
    list: { listStyleType: 'none', padding: 0, margin: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #e9ecef' },
    listDate: { fontWeight: 'bold', margin: '0 0 5px 0' },
    listNote: { color: '#6c757d', fontSize: '14px', margin: 0 },
    downloadLink: { color: '#007bff', textDecoration: 'none', fontWeight: 'bold', whiteSpace: 'nowrap' },
    noReport: { color: '#6c757d', fontStyle: 'italic', whiteSpace: 'nowrap' },
    errorMessage: { color: '#dc3545', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px', border: '1px solid #f5c6cb' },
    successMessage: { color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', border: '1px solid #c3e6cb' }
};

export default PatientDashboard;