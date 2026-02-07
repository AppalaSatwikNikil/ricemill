import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState('Verifying...');

    useEffect(() => {
        // Parse the hash parameters
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1)); // Remove the '#'
            const error = params.get('error');
            const error_description = params.get('error_description');

            if (error) {
                console.error("Auth Callback Error:", error, error_description);
                setMessage(`Error: ${error_description?.replace(/\+/g, ' ') || 'Authentication failed'}`);
                // Ideally show this for a few seconds then redirect to login
                setTimeout(() => navigate('/login'), 4000);
            } else {
                // If no error, implicit flow might have succeeded or just normal load
                navigate('/');
            }
        } else {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--color-bg-light)',
            color: 'var(--color-text-heading)'
        }}>
            <h2>{message}</h2>
            {message.startsWith('Error') && (
                <p>Redirecting to login...</p>
            )}
        </div>
    );
};

export default AuthCallback;
