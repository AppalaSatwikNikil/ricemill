import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { currentUser, userRole } = useAuth();
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        // Wait a bit for role to populate if user is logged in
        if (currentUser && userRole === null) {
            // Keep loading
        } else {
            setIsLoading(false);
        }
    }, [currentUser, userRole]);

    if (isLoading) {
        return <div className="loading-state"><div className="spinner"></div></div>;
    }

    if (!currentUser || userRole !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
