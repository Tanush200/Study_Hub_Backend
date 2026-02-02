const express = require("express");
const Note = require("../models/Note");
const User = require("../models/User");
const fileOwnership = require("../middleware/fileOwnership");
const { checkNoteDownloadLimit, checkNoteUploadLimit } = require('../middleware/subscriptionMiddleware');
const { deleteFromS3 } = require("../controllers/noteController");
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
router.post("/upload", authMiddleware, checkNoteUploadLimit, upload.single("file"), uploadNote);
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

router.patch("/:id/download", authMiddleware, checkNoteDownloadLimit, async (req, res) => {
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

// Special endpoint for downloading Notion-imported notes
router.get("/:id/download-content", authMiddleware, checkNoteDownloadLimit, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check if this is a Notion import (has data URL)
    if (note.file?.fileUrl && note.file.fileUrl.startsWith('data:text/markdown;base64,')) {
      // Extract base64 content
      const base64Content = note.file.fileUrl.replace('data:text/markdown;base64,', '');
      const markdownContent = Buffer.from(base64Content, 'base64').toString('utf-8');

      // Set headers for download
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title}.md"`);

      // Increment download counter
      await Note.findByIdAndUpdate(req.params.id, { $inc: { "metadata.downloads": 1 } });

      return res.send(markdownContent);
    } else if (note.file?.fileUrl) {
      // Regular S3 file - redirect to S3 URL
      return res.redirect(note.file.fileUrl);
    } else {
      return res.status(404).json({ message: "File not found" });
    }
  } catch (error) {
    console.error("Download content error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PDF download endpoint for Notion-imported notes
router.get("/:id/download-pdf", authMiddleware, checkNoteDownloadLimit, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check if this is a Notion import (has data URL)
    if (note.file?.fileUrl && note.file.fileUrl.startsWith('data:text/markdown;base64,')) {
      const puppeteer = require('puppeteer');
      const MarkdownIt = require('markdown-it');
      const fs = require('fs');

      const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
      });

      // Extract base64 content
      const base64Content = note.file.fileUrl.replace('data:text/markdown;base64,', '');
      const markdownContent = Buffer.from(base64Content, 'base64').toString('utf-8');

      // Get GitHub markdown CSS
      let css = '';
      try {
        const cssPath = require.resolve('github-markdown-css');
        css = fs.readFileSync(cssPath, 'utf8');
      } catch (e) {
        // Fallback CSS if file read fails
        console.warn('Could not load github-markdown-css, using fallback');
        css = `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; color: #24292e; } h1, h2, h3 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; } code { background-color: rgba(27,31,35,0.05); padding: 0.2em 0.4em; border-radius: 3px; font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace; } pre { background-color: #f6f8fa; padding: 16px; overflow: auto; border-radius: 3px; } blockquote { padding: 0 1em; color: #6a737d; border-left: 0.25em solid #dfe2e5; } table { border-collapse: collapse; width: 100%; } table th, table td { padding: 6px 13px; border: 1px solid #dfe2e5; } table tr:nth-child(2n) { background-color: #f6f8fa; } img { max-width: 100%; box-sizing: content-box; background-color: #fff; }`;
      }

      const htmlContent = md.render(markdownContent);
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            ${css}
            .markdown-body {
              box-sizing: border-box;
              min-width: 200px;
              max-width: 980px;
              margin: 0 auto;
              padding: 45px;
            }
            @media (max-width: 767px) {
              .markdown-body {
                padding: 15px;
              }
            }
            /* PDF Specific Adjustments */
            @page {
              margin: 20mm;
            }
          </style>
        </head>
        <body class="markdown-body">
          ${htmlContent}
        </body>
        </html>
      `;

      // Launch headless browser
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some container environments
      });

      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size: 10px; margin-left: 20px; color: #666;">' + note.title + '</div>',
        footerTemplate: '<div style="font-size: 10px; margin-left: 20px; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '20mm',
          right: '20mm'
        }
      });

      await browser.close();

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title}.pdf"`);

      // Increment download counter
      Note.findByIdAndUpdate(req.params.id, { $inc: { "metadata.downloads": 1 } }).exec();

      res.send(pdfBuffer);
    } else {
      return res.status(400).json({ message: "PDF conversion only available for Notion imports" });
    }
  } catch (error) {
    console.error("PDF download error:", error);
    res.status(500).json({ message: "Failed to generate PDF" });
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


    if (note.file?.s3Key) {
      try {
        await deleteFromS3(note.file.s3Key);
        console.log(`Deleted file from S3: ${note.file.s3Key}`);
      } catch (fileError) {
        console.error("Error deleting file from S3:", fileError);
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
