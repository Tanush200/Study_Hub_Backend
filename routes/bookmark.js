// backend/routes/bookmarks.js
const express = require("express");
const router = express.Router();
const Bookmark = require("../models/Bookmark");
const Note = require("../models/Note");
const auth = require("../middleware/auth");

// Add bookmark
router.post("/add", auth, async (req, res) => {
  try {
    const { noteId } = req.body;
    const userId = req.user.id || req.user.userId;

    // Check if note exists
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({ userId, noteId });
    if (existingBookmark) {
      return res.status(400).json({ message: "Note already bookmarked" });
    }

    // Create bookmark
    const bookmark = new Bookmark({ userId, noteId });
    await bookmark.save();

    res.status(201).json({
      message: "Note bookmarked successfully",
      bookmark,
    });
  } catch (error) {
    console.error("Bookmark error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove bookmark
router.delete("/remove", auth, async (req, res) => {
  try {
    const { noteId } = req.body;
    const userId = req.user.id || req.user.userId;

    const bookmark = await Bookmark.findOneAndDelete({ userId, noteId });

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    res.json({ message: "Bookmark removed successfully" });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check if bookmarked
router.get("/check/:noteId", auth, async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id || req.user.userId;

    const bookmark = await Bookmark.findOne({ userId, noteId });

    res.json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error("Check bookmark error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's bookmarks
router.get("/my-bookmarks", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const bookmarks = await Bookmark.find({ userId })
      .populate("noteId")
      .sort({ createdAt: -1 });

    res.json({
      bookmarks: bookmarks.filter((b) => b.noteId), // Filter out deleted notes
      total: bookmarks.length,
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
