import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        // Hardcoded credentials as requested
        const CORRECT_ID = "APPALASATWIKNIKIL";
        const CORRECT_PWD = "APPALAHANISH";

        if (adminId === CORRECT_ID && password === CORRECT_PWD) {
            // Generate a simple token (in production, use a secure backend JWT)
            const adminSession = {
                id: adminId,
                loginTime: new Date().getTime(),
                expiry: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 hours
            };
            localStorage.setItem('santi_admin_session', JSON.stringify(adminSession));
            navigate('/admin');
        } else {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <h2>Admin Portal</h2>
                    <p>Enter your credentials to access the dashboard</p>
                </div>

                {error && <div className="admin-login-error">{error}</div>}

                <form className="admin-login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Admin ID</label>
                        <input
                            type="text"
                            placeholder="Enter Admin ID"
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value.toUpperCase())}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="admin-login-btn">Secure Login</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
