import React from 'react';
import { Navigate } from 'react-router-dom';
import { apiUtils } from '../services/api';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = apiUtils.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
