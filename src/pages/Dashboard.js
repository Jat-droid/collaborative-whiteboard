import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // We will make this next

const Dashboard = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  
  // Get user info from Local Storage (Saved during login)
  const user = JSON.parse(localStorage.getItem("user")) || { name: "User" };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/room/${roomId}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1>Welcome, {user.name} 👋</h1>
        <p>What would you like to do today?</p>

        {/* Option 1: Create New */}
        <div className="action-section">
          <button className="create-btn" onClick={createRoom}>
            ➕ Create New Board
          </button>
        </div>

        <div className="divider">OR</div>

        {/* Option 2: Join Existing */}
        <form onSubmit={joinRoom} className="join-form">
          <input 
            type="text" 
            placeholder="Enter Room Code..." 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button type="submit" className="join-btn">Join Room</button>
        </form>

        <button className="logout-link" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
};

export default Dashboard;