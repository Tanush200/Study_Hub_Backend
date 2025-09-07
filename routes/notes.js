const express = require("express");
const Note = require("../models/Note");
const User = require("../models/User");
const {
  uploadNote,
  getNotes,
  getMyNotes,
} = require("../controllers/noteController");
const authMiddleware = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/upload");
const router = express.Router();


router.get("/", getNotes);
router.post("/upload", authMiddleware, upload.single("file"), uploadNote);
router.get("/my-notes", authMiddleware, getMyNotes);


router.get("/pending", authMiddleware, adminAuth , async (req, res) => {
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


router.patch("/:id/approve", authMiddleware,adminAuth, async (req, res) => {
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

router.patch("/:id/reject", authMiddleware,adminAuth, async (req, res) => {
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
