import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner-premium"></div>
                <p className="loading-text">SANTI RICE MILL</p>
            </div>
        );
    }

    if (currentUser) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PublicRoute;
