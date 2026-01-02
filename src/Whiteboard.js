import React, { useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Whiteboard.css';

const socket = io("http://localhost:3001");

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const prevPoint = useRef(null);
  
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!joined) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    // 1. Listen for LIVE drawing events
    socket.on("draw_line", ({ prevPoint, currentPoint, color }) => {
      drawLine(prevPoint, currentPoint, ctx, color);
    });

    // 2. ⚠️ THIS WAS MISSING! Listen for History
    socket.on("load_canvas", (history) => {
      console.log("Loading room history...", history.length); // Debug Log
      history.forEach(({ prevPoint, currentPoint, color }) => {
        drawLine(prevPoint, currentPoint, ctx, color);
      });
    });

    // 3. Listen for Clear
    socket.on("clear", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("draw_line");
      socket.off("load_canvas");
      socket.off("clear");
    };
  }, [joined]);

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      socket.emit("join_room", roomId);
      setJoined(true);
    }
  };

  const drawLine = (start, end, ctx, color) => {
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  const draw = (e) => {
    if (!isDrawing || !joined) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const currentPoint = { x: offsetX, y: offsetY };
    const ctx = canvasRef.current.getContext('2d');

    drawLine(prevPoint.current, currentPoint, ctx, color);

    socket.emit("draw_line", {
      roomId,
      prevPoint: prevPoint.current,
      currentPoint,
      color
    });

    prevPoint.current = currentPoint;
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    prevPoint.current = { x: offsetX, y: offsetY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    prevPoint.current = null;
  };

  if (!joined) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Welcome to CollabBoard 🎨</h1>
          <form onSubmit={joinRoom}>
            <input 
              type="text" 
              placeholder="Enter Room Name (e.g. 'TeamA')" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="room-input"
            />
            <button type="submit" className="join-btn">Join Room</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <div className="room-info">Room: <strong>{roomId}</strong></div>
        <div className="color-picker">
          <button className="color-btn" style={{backgroundColor: 'black'}} onClick={() => setColor('black')}/>
          <button className="color-btn" style={{backgroundColor: 'red'}} onClick={() => setColor('red')}/>
          <button className="color-btn" style={{backgroundColor: 'blue'}} onClick={() => setColor('blue')}/>
        </div>
        <button className="clear-btn" onClick={() => socket.emit("clear", roomId)}>🗑️ Clear</button>
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