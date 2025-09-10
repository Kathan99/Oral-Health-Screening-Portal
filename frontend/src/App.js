import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AnnotationPage from './pages/AnnotationPage';

// Helper functions to check authentication status and user role
const isAuthenticated = () => !!localStorage.getItem('token');
const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        return jwtDecode(token).user.role;
    } catch (e) {
        localStorage.removeItem('token');
        return null;
    }
};

// This component protects routes that require a specific role (e.g., patient, admin)
const ProtectedRoute = ({ children, role }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" />;
    }
    if (role && getUserRole() !== role) {
        localStorage.removeItem('token');
        return <Navigate to="/login" />;
    }
    return children;
};

function App() {
    const role = getUserRole();

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login'; // Force a refresh to clear all state
    };

    return (
        <Router>
            <nav style={styles.nav}>
                <Link to="/login" style={styles.navLink}>
                    OralVis Health Portal
                </Link>
                {isAuthenticated() && (
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        Logout
                    </button>
                )}
            </nav>
            <main style={{ padding: '1rem' }}>
                <Routes>
                    {/*
                      NEW ROUTING LOGIC:
                      - The root path "/" now always redirects to "/login".
                      - The "/login" route checks if a user is already authenticated.
                        If they are, it redirects them to their dashboard.
                        If not, it shows the LoginPage.
                    */}
                    <Route
                        path="/login"
                        element={
                            isAuthenticated() ? (
                                <Navigate to={role === 'admin' ? '/admin' : '/patient'} />
                            ) : (
                                <LoginPage />
                            )
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            isAuthenticated() ? (
                                <Navigate to="/patient" />
                            ) : (
                                <RegisterPage />
                            )
                        }
                    />

                    {/* Protected Routes remain the same */}
                    <Route path="/patient" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/submission/:id" element={<ProtectedRoute role="admin"><AnnotationPage /></ProtectedRoute>} />

                    {/* The default route now points to login */}
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </main>
        </Router>
    );
}

const styles = {
    nav: { background: '#333', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    navLink: { color: 'white', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' },
    logoutButton: { background: '#f44336', border: 'none', color: 'white', cursor: 'pointer', padding: '8px 12px', borderRadius: '4px' }
};

export default App;