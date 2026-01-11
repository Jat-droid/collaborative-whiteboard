import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Whiteboard from "./pages/Whiteboard"; // Note the new path
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
          {/* Route 1: Login Page (Default) */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} /> 
          <Route path="/room/:roomId" element={<Whiteboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;