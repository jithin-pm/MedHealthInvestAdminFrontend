import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const admin = JSON.parse(localStorage.getItem('medhealthinvestadmin'));

    if (!admin || !admin.accessToken || admin.role !== 'admin') {
        // Redirect to login if no admin session found or role is incorrect
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
