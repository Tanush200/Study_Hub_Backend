const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
} = require("../controllers/commentController");


router.get("/notes/:noteId/comments", getComments);
router.post("/notes/:noteId/comments", authMiddleware, createComment);
router.patch("/comments/:id", authMiddleware, updateComment);
router.delete("/comments/:id", authMiddleware, deleteComment);
router.patch("/comments/:id/like", authMiddleware, toggleLike);

module.exports = router;
