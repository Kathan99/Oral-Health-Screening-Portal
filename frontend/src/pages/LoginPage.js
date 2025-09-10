import React, {useState,useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const { email, password } = formData;

    // This hook checks for a success message from the registration page
    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [location]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setSuccessMessage('');
        try {
            const res = await axios.post('https://oral-health-screening-portal.onrender.com/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            const { user } = jwtDecode(res.data.token);

            // The backend determines the role; the frontend just redirects.
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/patient');
            }
        } catch (err) {
            setError(err.response.data.msg || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div style={styles.container}>
            <h2>Portal Login</h2>
            <p>Welcome back! Please enter your credentials to continue.</p>
            
            {successMessage && <p style={styles.successMessage}>{successMessage}</p>}
            {error && <p style={styles.errorMessage}>{error}</p>}

            <form onSubmit={onSubmit}>
                <label style={styles.label}>Email Address</label>
                <input 
                    type="email" 
                    name="email" 
                    value={email} 
                    onChange={onChange} 
                    placeholder="e.g., user@example.com" 
                    required 
                    style={styles.input}
                />

                <label style={styles.label}>Password</label>
                <input 
                    type="password" 
                    name="password" 
                    value={password} 
                    onChange={onChange} 
                    placeholder="Enter your password" 
                    required 
                    style={styles.input}
                />
                
                <button type="submit" style={styles.button}>Login</button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                New Patient? <Link to="/register">Create an Account</Link>
            </p>
        </div>
    );
};

// Updated styles for a more polished look
const styles = {
    container: { maxWidth: '420px', margin: '60px auto', padding: '30px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px' },
    label: { display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' },
    input: { display: 'block', width: 'calc(100% - 22px)', padding: '11px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ced4da' },
    button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold' },
    errorMessage: { color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px', border: '1px solid #f5c6cb', textAlign: 'center' },
    successMessage: { color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', border: '1px solid #c3e6cb', textAlign: 'center' }
};

export default LoginPage;