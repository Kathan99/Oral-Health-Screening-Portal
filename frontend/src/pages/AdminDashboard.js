import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [submissions, setSubmissions] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('https://oral-health-screening-portal.onrender.com/api/submissions', {
                    headers: { 'x-auth-token': token }
                });
                setSubmissions(res.data);
            } catch (err) {
                setError('Failed to fetch submissions.');
            }
        };
        fetchSubmissions();
    }, []);

    const handleViewClick = (id) => navigate(`/submission/${id}`);

    // NEW LOGOUT FUNCTION
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login'; // Redirect to login page
    };

    const StatusBadge = ({ status }) => {
        const style = {
            padding: '4px 10px',
            borderRadius: '12px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            backgroundColor: '#6c757d' // Default grey
        };

        if (status === 'uploaded') {
            style.backgroundColor = '#ffc107'; // Yellow
            style.color = '#333';
        } else if (status === 'annotated') {
            style.backgroundColor = '#17a2b8'; // Blue
        } else if (status === 'reported') {
            style.backgroundColor = '#28a745'; // Green
        }
        return <span style={style}>{status}</span>;
    };


    return (
        <div style={styles.page}>
            {/* HEADER WITH LOGOUT BUTTON */}
            <div style={styles.header}>
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
            </div>

            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Patient Submissions</h2>
                <p style={styles.cardSubtitle}>Review and annotate all incoming patient submissions.</p>

                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Patient Name</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map(sub => (
                            <tr key={sub._id} style={styles.tr}>
                                <td style={styles.td}>{sub.name}</td>
                                <td style={styles.td}>{sub.email}</td>
                                <td style={styles.td}>{new Date(sub.createdAt).toLocaleDateString()}</td>
                                <td style={styles.td}><StatusBadge status={sub.status} /></td>
                                <td style={styles.td}>
                                    <button onClick={() => handleViewClick(sub._id)} style={styles.button}>
                                        {sub.status === 'uploaded' ? 'Review & Annotate' : 'View Details'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Professional CSS-in-JS Styles ---
const styles = {
    page: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    logoutButton: { padding: '10px 18px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    cardTitle: { marginTop: 0, marginBottom: '5px' },
    cardSubtitle: { color: '#6c757d', fontSize: '14px', marginTop: 0, marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { backgroundColor: '#f8f9fa', padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' },
    tr: { '&:hover': { backgroundColor: '#f1f1f1' } },
    td: { padding: '12px', borderBottom: '1px solid #dee2e6' },
    button: { padding: '8px 12px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }
};

export default AdminDashboard;