const Comment = require("../models/Comment");
const Note = require("../models/Note");
const XPService = require("../services/xpService");

const buildCommentsTree = (comments) => {
  const commentMap = new Map();
  comments.forEach((comment) => {
    commentMap.set(comment._id.toString(), {
      ...comment.toObject(),
      replies: [],
    });
  });

  const rootComments = [];
  


  comments.forEach((comment) => {
    const commentObj = commentMap.get(comment._id.toString());

    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId.toString());
      if (parent) {
        parent.replies.push(commentObj);
      }
    } else {
      rootComments.push(commentObj);
    }
  });

  const sortCommentsRecursively = (commentsList) => {
    commentsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    commentsList.forEach((comment) => {
      if (comment.replies && comment.replies.length > 0) {
        sortCommentsRecursively(comment.replies);
      }
    });
  };

  sortCommentsRecursively(rootComments);
  return rootComments;
};



const getComments = async (req, res) => {
  try {
    const { noteId } = req.params;

    const allComments = await Comment.find({
      noteId,
      isDeleted: false,
    })
      .populate("authorId", "username profile")
      .sort({ createdAt: 1 });

    const commentsTree = buildCommentsTree(allComments);

    res.json(commentsTree);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createComment = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { text, parentCommentId } = req.body;
    const authorId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }


    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
    }

    const comment = await Comment.create({
      text: text.trim(),
      noteId,
      authorId,
      parentCommentId: parentCommentId || null,
    });


    await comment.populate("authorId", "username profile");

     const xpResult = await XPService.awardXP(
       req.user.id,
       "COMMENT",
       null,
       comment._id,
       `Commented on note: ${note.title}`
     );

     

   res.status(201).json({
     message: "Comment created successfully",
     comment,
     gamification: {
       xpEarned: xpResult.earnedXP,
       newBadges: xpResult.newBadges,
       completedChallenges: xpResult.completedChallenges,
     },
   });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }


    const comment = await Comment.findOne({ _id: id, isDeleted: false });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (
      comment.authorId.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

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


const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }


    if (
      comment.authorId.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }


    comment.isDeleted = true;
    comment.text = "[Comment deleted]";
    await comment.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


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
      comment.likedBy.pull(userId);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
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
