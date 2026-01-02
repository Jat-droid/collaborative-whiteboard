const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

// 1. Import our new clean Model
const Line = require("./models/Line"); 

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// 2. Connect to Database (Replace with YOUR Password from Day 7)
// ⚠️ Keep your actual password here!
const MONGO_URI = "mongodb+srv://admin:virat123@cluster0.sxoykym.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. Join Room & Load Specific History
  socket.on("join_room", async (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);

    // 🔍 FILTER: Only find lines that belong to this Room ID
    const roomHistory = await Line.find({ roomId }); 
    
    // Send history ONLY to the person who just joined
    socket.emit("load_canvas", roomHistory);
  });

  // 2. Draw & Save with Room ID
  socket.on("draw_line", async (data) => {
    const { roomId, prevPoint, currentPoint, color } = data;

    // Save to DB with the Room ID tag
    const newLine = new Line({
      roomId, // 👈 Important: Save the tag
      prevPoint,
      currentPoint,
      color
    });
    
    try {
        await newLine.save();
        // Broadcast to neighbors in the room
        socket.to(roomId).emit("draw_line", { prevPoint, currentPoint, color });
    } catch (err) {
        console.error("Error saving line:", err);
    }
  });

  // 3. Clear Specific Room
  socket.on("clear", async (roomId) => {
    // Delete only lines with this Room ID
    await Line.deleteMany({ roomId });
    
    // Tell everyone in the room to wipe their screen
    io.to(roomId).emit("clear");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING ON 3001");
});