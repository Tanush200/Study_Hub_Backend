const Comment = require("../models/Comment");
const Note = require("../models/Note");

/**
 * GET COMMENTS FOR A NOTE
 * GET /api/notes/:noteId/comments
 * Retrieves all comments with nested replies structure
 */
// const getComments = async (req, res) => {
//   try {
//     const { noteId } = req.params;

//     // Get all comments for the note
//     const allComments = await Comment.find({
//       noteId,
//       isDeleted: false,
//     })
//       .populate("authorId", "username profile")
//       .sort({ createdAt: 1 }); // Sort by oldest first for proper tree building

//     // ✅ BUILD RECURSIVE COMMENT TREE
//     const commentsTree = buildCommentsTree(allComments);

//     res.json(commentsTree);
//   } catch (error) {
//     console.error("Get comments error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ✅ ADD THIS HELPER FUNCTION
// const buildCommentsTree = (comments) => {
//   const map = new Map();
//   const roots = [];

//   // Initialize map with all comments
//   comments.forEach((comment) => {
//     map.set(comment._id.toString(), {
//       ...comment.toObject(),
//       replies: [],
//     });
//   });

//   // Build the tree structure
//   comments.forEach((comment) => {
//     const commentObj = map.get(comment._id.toString());

//     if (comment.parentCommentId) {
//       // It's a reply - add to parent's replies array
//       const parent = map.get(comment.parentCommentId.toString());
//       if (parent) {
//         parent.replies.push(commentObj);
//       }
//     } else {
//       // It's a root comment
//       roots.push(commentObj);
//     }
//   });

//   // Sort root comments by newest first
//   return roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
// };


// ✅ FIXED: Improved recursive comment tree builder
const buildCommentsTree = (comments) => {
  const commentMap = new Map();

  // Initialize map with all comments
  comments.forEach((comment) => {
    commentMap.set(comment._id.toString(), {
      ...comment.toObject(),
      replies: [],
    });
  });

  const roots = [];

  // Build the tree structure
  comments.forEach((comment) => {
    const commentObj = commentMap.get(comment._id.toString());

    if (comment.parentCommentId) {
      // It's a reply - add to parent's replies array
      const parent = commentMap.get(comment.parentCommentId.toString());
      if (parent) {
        parent.replies.push(commentObj);
      }
    } else {
      // It's a root comment
      roots.push(commentObj);
    }
  });

  // ✅ FIXED: Recursive sorting function
  const sortReplies = (nodes) => {
    nodes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    nodes.forEach((node) => {
      if (node.replies && node.replies.length > 0) {
        sortReplies(node.replies);
      }
    });
  };

  sortReplies(roots);
  return roots;
};



const getComments = async (req, res) => {
  try {
    const { noteId } = req.params;

    const allComments = await Comment.find({
      noteId,
      isDeleted: false,
    })
      .populate("authorId", "username profile")
      .sort({ createdAt: 1 }); // Sort by oldest first for proper tree building

    // ✅ FIXED: Use improved tree builder
    const commentsTree = buildCommentsTree(allComments);

    res.json(commentsTree);
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
