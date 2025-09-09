const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


bookmarkSchema.index({ userId: 1, noteId: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
