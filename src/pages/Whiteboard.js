import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './Whiteboard.css';

// Automatically uses the URL from .env
const socket = io(process.env.REACT_APP_SERVER_URL);

const Whiteboard = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000'); // Default Black
  const prevPoint = useRef(null);

  useEffect(() => {
    // 1. Join Room
    socket.emit("join_room", roomId);

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    // Fill white background (Important for Eraser to look right)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- SOCKET LISTENERS ---
    
    // Live Drawing
    socket.on("draw_line", ({ prevPoint, currentPoint, color }) => {
      drawLine(prevPoint, currentPoint, ctx, color);
    });

    // Load History / Undo Refresh
    socket.on("load_canvas", (history) => {
      history.forEach(({ prevPoint, currentPoint, color }) => {
        drawLine(prevPoint, currentPoint, ctx, color);
      });
    });

    // Clear Board
    socket.on("clear", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // Keyboard Shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        socket.emit("undo", roomId);
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        socket.emit("redo", roomId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      socket.off("draw_line");
      socket.off("load_canvas");
      socket.off("clear");
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [roomId]);

  // 🎨 SMART DRAW FUNCTION
  const drawLine = (start, end, ctx, color) => {
    ctx.beginPath();
    
    // If color is White (Eraser), make it THICK (15px). Else Normal (5px).
    ctx.lineWidth = (color === '#ffffff') ? 15 : 5;
    
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    prevPoint.current = { x: offsetX, y: offsetY };
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const currentPoint = { x: offsetX, y: offsetY };
    const ctx = canvasRef.current.getContext('2d');

    // Draw locally
    drawLine(prevPoint.current, currentPoint, ctx, color);

    // Send to Server
    socket.emit("draw_line", {
      roomId,
      prevPoint: prevPoint.current,
      currentPoint,
      color
    });

    prevPoint.current = currentPoint;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    prevPoint.current = null;
  };

  // Button Actions
  const handleUndo = () => socket.emit("undo", roomId);
  const handleRedo = () => socket.emit("redo", roomId);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <div className="room-info">Room: <strong>{roomId}</strong></div>
        
        <div className="color-picker">
          <button className="color-btn" style={{backgroundColor: 'black'}} onClick={() => setColor('#000000')}/>
          <button className="color-btn" style={{backgroundColor: 'red'}} onClick={() => setColor('red')}/>
          <button className="color-btn" style={{backgroundColor: 'blue'}} onClick={() => setColor('blue')}/>
          
          {/* 🧼 ERASER (White Pen) */}
          <button 
            className="color-btn" 
            style={{backgroundColor: 'white', border: '2px solid #ccc', fontSize: '12px'}} 
            onClick={() => setColor('#ffffff')} 
            title="Eraser"
          >
            🧼
          </button>
        </div>

        <div className="action-buttons">
          {/* ↩️ UNDO / REDO */}
          <button className="tool-btn" onClick={handleUndo} title="Undo (Ctrl+Z)">↩️</button>
          <button className="tool-btn" onClick={handleRedo} title="Redo (Ctrl+Y)">↪️</button>
          
          <button className="clear-btn" onClick={() => socket.emit("clear", roomId)}>🗑️ Clear</button>
          <button className="logout-btn" onClick={handleLogout} style={{backgroundColor: '#6c757d', marginLeft: '10px'}}>Exit</button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="canvas-board"
      />
    </div>
  );
};

export default Whiteboard;