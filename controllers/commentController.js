const Comment = require("../models/Comment");
const Note = require("../models/Note");

/**
 * GET COMMENTS FOR A NOTE
 * GET /api/notes/:noteId/comments
 * Retrieves all comments with nested replies structure
 */
const getComments = async (req, res) => {
  try {
    const { noteId } = req.params;

    // Get all comments for the note (root comments + replies)
    const allComments = await Comment.find({
      noteId,
      isDeleted: false,
    })
      .populate("authorId", "username profile")
      .sort({ createdAt: -1 });

    // Organize comments into nested structure
    const rootComments = allComments.filter(
      (comment) => !comment.parentCommentId
    );
    const replies = allComments.filter((comment) => comment.parentCommentId);

    // Attach replies to their parent comments
    const commentsWithReplies = rootComments.map((rootComment) => {
      const commentReplies = replies.filter(
        (reply) =>
          reply.parentCommentId.toString() === rootComment._id.toString()
      );

      return {
        ...rootComment.toObject(),
        replies: commentReplies.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        ),
      };
    });

    res.json(commentsWithReplies);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * CREATE NEW COMMENT
 * POST /api/notes/:noteId/comments
 * Creates a new comment or reply
 */
const createComment = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { text, parentCommentId } = req.body;
    const authorId = req.user._id;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Verify note exists
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // If it's a reply, verify parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
    }

    // Create comment
    const comment = await Comment.create({
      text: text.trim(),
      noteId,
      authorId,
      parentCommentId: parentCommentId || null,
    });

    // Populate author info for response
    await comment.populate("authorId", "username profile");

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE COMMENT
 * PATCH /api/comments/:id
 * Allows users to edit their own comments
 */
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Find comment and verify ownership
    const comment = await Comment.findOne({ _id: id, isDeleted: false });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user owns the comment or is admin
    if (
      comment.authorId.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update comment
    comment.text = text.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate("authorId", "username profile");

    res.json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE COMMENT
 * DELETE /api/comments/:id
 * Soft delete - marks comment as deleted
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check ownership or admin privileges
    if (
      comment.authorId.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.text = "[Comment deleted]";
    await comment.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * LIKE/UNLIKE COMMENT
 * PATCH /api/comments/:id/like
 * Toggle like status for a comment
 */
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findOne({ _id: id, isDeleted: false });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const hasLiked = comment.likedBy.includes(userId);

    if (hasLiked) {
      // Remove like
      comment.likedBy.pull(userId);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      // Add like
      comment.likedBy.push(userId);
      comment.likes += 1;
    }

    await comment.save();

    res.json({
      likes: comment.likes,
      hasLiked: !hasLiked,
    });
  } catch (error) {
    console.error("Like comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
};
