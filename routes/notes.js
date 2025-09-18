const express = require("express");
const Note = require("../models/Note");
const User = require("../models/User");
const fileOwnership = require("../middleware/fileOwnership");
const imagekit = require("../utils/imagekit"); 
const XPService = require("../services/xpService");
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

router.get("/pending", authMiddleware, adminAuth, async (req, res) => {
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

router.patch("/:id/approve", authMiddleware, adminAuth, async (req, res) => {
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

router.patch("/:id/reject", authMiddleware, adminAuth, async (req, res) => {
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

router.patch("/:id/view", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { "metadata.views": 1 },
        $set: { "metadata.lastViewedAt": new Date() },
      },
      { new: true }
    );
    res.json({ views: note.metadata.views });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/download", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $inc: { "metadata.downloads": 1 } },
      { new: true }
    );
    res.json({ downloads: note.metadata.downloads });
  } catch (error) {
    console.error("Download update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/like", authMiddleware, async (req, res) => {
  try {
    const { action } = req.body;
    const userId = req.user.id;
    const noteId = req.params.id;

    console.log("Like/Dislike request:", { noteId, userId, action });

    if (!action || !["like", "dislike"].includes(action)) {
      return res.status(400).json({
        message: 'Invalid action. Use "like" or "dislike"',
      });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (!note.metadata) {
      note.metadata = {
        views: 0,
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
      };
    }
    if (!note.metadata.likedBy) note.metadata.likedBy = [];
    if (!note.metadata.dislikedBy) note.metadata.dislikedBy = [];

    const hasLiked = note.metadata.likedBy.includes(userId);
    const hasDisliked = note.metadata.dislikedBy.includes(userId);

    if (action === "like") {
      if (hasLiked) {
        note.metadata.likedBy.pull(userId);
        note.metadata.likes = Math.max(0, note.metadata.likes - 1);
      } else {
        note.metadata.likedBy.push(userId);
        note.metadata.likes += 1;

        if (hasDisliked) {
          note.metadata.dislikedBy.pull(userId);
          note.metadata.dislikes = Math.max(0, note.metadata.dislikes - 1);
        }
      }
    } else if (action === "dislike") {
      if (hasDisliked) {
        note.metadata.dislikedBy.pull(userId);
        note.metadata.dislikes = Math.max(0, note.metadata.dislikes - 1);
      } else {
        note.metadata.dislikedBy.push(userId);
        note.metadata.dislikes += 1;

        if (hasLiked) {
          note.metadata.likedBy.pull(userId);
          note.metadata.likes = Math.max(0, note.metadata.likes - 1);
        }
      }
    }

    await note.save();

    const response = {
      likes: note.metadata.likes,
      dislikes: note.metadata.dislikes,
      hasLiked: note.metadata.likedBy.includes(userId),
      hasDisliked: note.metadata.dislikedBy.includes(userId),
    };

    console.log("Response:", response);
    res.json(response);
  } catch (error) {
    console.error("Like route error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.delete("/:id", authMiddleware, fileOwnership, async (req, res) => {
  try {
    const note = req.note;


    if (note.file?.imagekitId) {
      try {
        await imagekit.deleteFile(note.file.imagekitId);
        console.log(`Deleted file from ImageKit: ${note.file.imagekitId}`);
      } catch (fileError) {
        console.error("Error deleting file from ImageKit:", fileError);
   
      }
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({
      message: "Note deleted successfully",
      deletedNote: {
        id: note._id,
        title: note.title,
      },
    });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ message: "Server error during deletion" });
  }
});

module.exports = router;

// For cloudinary

// const express = require("express");
// const Note = require("../models/Note");
// const User = require("../models/User");
// const fileOwnership = require("../middleware/fileOwnership");
// const fs = require("fs");
// const path = require("path");

// const {
//   uploadNote,
//   getNotes,
//   getMyNotes,
// } = require("../controllers/noteController");
// const authMiddleware = require("../middleware/auth");
// const adminAuth = require("../middleware/adminAuth");
// const upload = require("../middleware/upload");
// const router = express.Router();

// router.get("/", getNotes);
// router.post("/upload", authMiddleware, upload.single("file"), uploadNote);
// router.get("/my-notes", authMiddleware, getMyNotes);

// router.get("/pending", authMiddleware, adminAuth , async (req, res) => {
//   try {
//     const pendingNotes = await Note.find({ status: "pending" })
//       .populate("uploaderId", "username profile email")
//       .sort({ createdAt: -1 });

//     res.json(pendingNotes);
//   } catch (error) {
//     console.error("Get pending notes error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.patch("/:id/approve", authMiddleware,adminAuth, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const note = await Note.findByIdAndUpdate(
//       id,
//       { status: "approved" },
//       { new: true }
//     ).populate("uploaderId", "username profile");

//     if (!note) {
//       return res.status(404).json({ message: "Note not found" });
//     }

//     await User.findByIdAndUpdate(note.uploaderId._id, {
//       $inc: { "stats.notesUploaded": 1 },
//     });

//     res.json({
//       message: "Note approved successfully",
//       note,
//     });
//   } catch (error) {
//     console.error("Approve note error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.patch("/:id/reject", authMiddleware,adminAuth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;

//     const note = await Note.findByIdAndUpdate(
//       id,
//       {
//         status: "rejected",
//         rejectionReason: reason || "No reason provided",
//       },
//       { new: true }
//     ).populate("uploaderId", "username profile");

//     if (!note) {
//       return res.status(404).json({ message: "Note not found" });
//     }

//     res.json({
//       message: "Note rejected",
//       note,
//     });
//   } catch (error) {
//     console.error("Reject note error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.patch('/:id/view', authMiddleware, async (req, res) => {
//     try {
//         const note = await Note.findByIdAndUpdate(req.params.id, {
//             $inc: { 'metadata.views': 1 }
//         }, { new: true });
//         res.json({views : note.metadata.views})
//     } catch (error) {
//           res.status(500).json({ message: "Server error" });
//     }
// })

// router.patch('/:id/download', authMiddleware, async (req, res) => {
//     try {
//         const note = await Note.findByIdAndUpdate(
//           req.params.id,
//           { $inc: { "metadata.downloads": 1 } },
//           { new: true }
//         );
//         res.json({ downloads: note.metadata.downloads });
//     } catch (error) {
//        console.error("View update error:", error);
//        res.status(500).json({ message: "Server error" });
//     }
// })

// router.patch("/:id/like", authMiddleware, async (req, res) => {
//   try {
//     const { action } = req.body;
//     const userId = req.user.id;
//     const noteId = req.params.id;

//     console.log("Like/Dislike request:", { noteId, userId, action });

//     if (!action || !["like", "dislike"].includes(action)) {
//       return res.status(400).json({
//         message: 'Invalid action. Use "like" or "dislike"',
//       });
//     }

//     const note = await Note.findById(noteId);
//     if (!note) {
//       return res.status(404).json({ message: "Note not found" });
//     }

//     if (!note.metadata) {
//       note.metadata = {
//         views: 0,
//         likes: 0,
//         dislikes: 0,
//         likedBy: [],
//         dislikedBy: [],
//       };
//     }
//     if (!note.metadata.likedBy) note.metadata.likedBy = [];
//     if (!note.metadata.dislikedBy) note.metadata.dislikedBy = [];

//     const hasLiked = note.metadata.likedBy.includes(userId);
//     const hasDisliked = note.metadata.dislikedBy.includes(userId);

//     if (action === "like") {
//       if (hasLiked) {

//         note.metadata.likedBy.pull(userId);
//         note.metadata.likes = Math.max(0, note.metadata.likes - 1);
//       } else {

//         note.metadata.likedBy.push(userId);
//         note.metadata.likes += 1;

//         if (hasDisliked) {
//           note.metadata.dislikedBy.pull(userId);
//           note.metadata.dislikes = Math.max(0, note.metadata.dislikes - 1);
//         }
//       }
//     } else if (action === "dislike") {

//       if (hasDisliked) {

//         note.metadata.dislikedBy.pull(userId);
//         note.metadata.dislikes = Math.max(0, note.metadata.dislikes - 1);
//       } else {

//         note.metadata.dislikedBy.push(userId);
//         note.metadata.dislikes += 1;

//         if (hasLiked) {
//           note.metadata.likedBy.pull(userId);
//           note.metadata.likes = Math.max(0, note.metadata.likes - 1);
//         }
//       }
//     }

//     await note.save();

//     const response = {
//       likes: note.metadata.likes,
//       dislikes: note.metadata.dislikes,
//       hasLiked: note.metadata.likedBy.includes(userId),
//       hasDisliked: note.metadata.dislikedBy.includes(userId),
//     };

//     console.log("Response:", response);
//     res.json(response);
//   } catch (error) {
//     console.error("Like route error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// router.delete("/:id",authMiddleware, fileOwnership, async (req, res) => {
//    try {
//     const note = req.note;
//     if(note.file?.filePath){
//         const fullPath = path.join(__dirname, '..', note.file.filePath);
//         try {
//           if(fs.existsSync(fullPath)){
//             fs.unlinkSync(fullPath);
//             console.log(`Deleted file at: ${fullPath}`);

//           }
//         } catch (error) {
//            console.error("Error deleting physical file:", fileError);
//         }
//     }
//     await Note.findByIdAndDelete(req.params.id);
//     res.json({
//       message: "Note deleted successfully",
//       deletedNote:{
//         id:note._id,
//         title:note.title
//       }
//     });
//    } catch (error) {
//         console.error("Delete note error:", error);
//         res.status(500).json({ message: "Server error during deletion" });
//    }
// })

// module.exports = router;
