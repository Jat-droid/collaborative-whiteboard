import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // We reuse the login styles

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // 1. Send data to Backend
    // ⚠️ NOTE: We use localhost:3001 because we are testing locally first!
    try {
      const API_URL = process.env.REACT_APP_SERVER_URL;
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration Successful! Please Log In.");
            navigate("/"); // Redirect to Login Page
        } else {
            alert(data.message); // Show error (e.g., "User already exists")
        }
    } catch (error) {
        console.error("Signup Error:", error);
        alert("Server error. Is the Backend running?");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Create Account 🚀</h2>
        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="login-btn">Sign Up</button>
        </form>
        <p className="switch-text">
            Already have an account? <a href="/">Log In</a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;