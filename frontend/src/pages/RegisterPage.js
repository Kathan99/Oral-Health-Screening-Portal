import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            // The backend creates the user successfully.
            await axios.post('https://oral-health-screening-portal.onrender.com/api/auth/register', { email, password });

            // NEW LOGIC: Instead of logging in, redirect to the login page.
            // We pass a success message in the navigation state.
            navigate('/login', { state: { message: 'Registration successful! Please log in.' } });

        } catch (err) {
            setError(err.response.data.msg || 'Registration failed. Please try again.');
        }
    };

    return (
        <div style={styles.container}>
            <h2>Create a New Patient Account</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={onSubmit}>
                <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    placeholder="Email Address"
                    required
                    style={styles.input}
                />
                <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    placeholder="Password (6+ characters)"
                    required
                    minLength="6"
                    style={styles.input}
                />
                <button type="submit" style={styles.button}>Register</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '15px' }}>
                Already have an account? <Link to="/login">Login Here</Link>
            </p>
        </div>
    );
};

const styles = {
    container: { maxWidth: '400px', margin: '50px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px' },
    input: { display: 'block', width: '95%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' },
    button: { width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '16px' }
};

export default RegisterPage;