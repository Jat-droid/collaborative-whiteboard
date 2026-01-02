const mongoose = require("mongoose");

const LineSchema = new mongoose.Schema({
  roomId: { // 👈 NEW FIELD
    type: String, 
    required: true 
  },
  prevPoint: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  currentPoint: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  color: { type: String, required: true },
});

module.exports = mongoose.model("Line", LineSchema);