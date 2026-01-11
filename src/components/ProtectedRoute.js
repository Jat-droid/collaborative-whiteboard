import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 1. Check if the user has a token (Digital ID)
  const token = localStorage.getItem("token");

  // 2. If NO token, kick them back to the Login Page ("/")
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 3. If YES token, render the page they asked for
  return children;
};

export default ProtectedRoute;