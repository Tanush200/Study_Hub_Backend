const express = require("express");
const Note = require("../models/Note"); // ← Required for admin routes
const User = require("../models/User"); // ← Required for user updates
const {
  uploadNote,
  getNotes,
  getMyNotes,
} = require("../controllers/noteController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const router = express.Router();

// Existing routes
router.get("/", getNotes);
router.post("/upload", authMiddleware, upload.single("file"), uploadNote);
router.get("/my-notes", authMiddleware, getMyNotes);

// NEW ADMIN ROUTES
// @route   GET /api/notes/pending
// @desc    Get all pending notes (admin only)
router.get("/pending", authMiddleware, async (req, res) => {
  try {
    const pendingNotes = await Note.find({ status: "pending" })
      .populate("uploaderId", "username profile email")
      .sort({ createdAt: -1 });

    res.json(pendingNotes);
  } catch (error) {
    console.error("Get pending notes error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PATCH /api/notes/:id/approve
// @desc    Approve a note (admin only)
router.patch("/:id/approve", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    ).populate("uploaderId", "username profile");

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Update user stats
    await User.findByIdAndUpdate(note.uploaderId._id, {
      $inc: { "stats.notesUploaded": 1 },
    });

    res.json({
      message: "Note approved successfully",
      note,
    });
  } catch (error) {
    console.error("Approve note error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PATCH /api/notes/:id/reject
// @desc    Reject a note (admin only)
router.patch("/:id/reject", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const note = await Note.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        rejectionReason: reason || "No reason provided",
      },
      { new: true }
    ).populate("uploaderId", "username profile");

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({
      message: "Note rejected",
      note,
    });
  } catch (error) {
    console.error("Reject note error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
