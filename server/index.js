const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/auth"); // Authentication routes
const Line = require("./models/Line"); // Database Model

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use("/api/auth", authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

// Connect to MongoDB (Replace with your connection string if needed)
mongoose
.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// --- MEMORY STORAGE FOR REDO ---
// Key: roomId, Value: Array of deleted line objects
const redoStacks = {};

io.on("connection", (socket) => {
  // 1. Join Room
  socket.on("join_room", async (roomId) => {
    socket.join(roomId);
    // Send existing history to the user
    const history = await Line.find({ roomId });
    socket.emit("load_canvas", history);
  });

  // 2. Draw Line (Updated for Redo Logic)
  socket.on("draw_line", async (data) => {
    // If user draws something new, the "Redo" future is invalid. Clear it.
    if (redoStacks[data.roomId]) {
      redoStacks[data.roomId] = [];
    }

    // Save to DB
    const newLine = new Line(data);
    await newLine.save();

    // Broadcast to others
    socket.broadcast.to(data.roomId).emit("draw_line", data);
  });

  // 3. Clear Specific Room
  socket.on("clear", async (roomId) => {
    await Line.deleteMany({ roomId });
    // Also clear the redo stack for this room
    redoStacks[roomId] = [];
    io.to(roomId).emit("clear");
  });

// 4. UNDO Logic (Debug Version)
  socket.on("undo", async (roomId) => {
    console.log(`↩️ Undo requested for Room: ${roomId}`); // DEBUG LOG

    const lastLine = await Line.findOne({ roomId }).sort({ _id: -1 });

    if (lastLine) {
      console.log(`Found line to delete: ${lastLine._id}`); // DEBUG LOG
      
      await Line.findByIdAndDelete(lastLine._id);

      if (!redoStacks[roomId]) redoStacks[roomId] = [];
      redoStacks[roomId].push(lastLine);

      const allLines = await Line.find({ roomId });
      
      // Emit events to frontend
      io.to(roomId).emit("clear"); 
      io.to(roomId).emit("load_canvas", allLines);
      
      console.log(`Board refreshed with ${allLines.length} lines`); // DEBUG LOG
    } else {
      console.log("No lines found to undo!"); // DEBUG LOG
    }
  });

  // 5. REDO Logic (Debug Version)
  socket.on("redo", async (roomId) => {
    console.log(`↪️ Redo requested for Room: ${roomId}`); // DEBUG LOG
    
    if (redoStacks[roomId] && redoStacks[roomId].length > 0) {
      const lineToRestore = redoStacks[roomId].pop();
      console.log(`Restoring line...`); // DEBUG LOG

      const newLineData = lineToRestore.toObject();
      delete newLineData._id; 
      const newLine = new Line(newLineData);
      await newLine.save();

      io.to(roomId).emit("draw_line", newLine);
    } else {
        console.log("Redo stack is empty."); // DEBUG LOG
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON ${PORT}`);
});