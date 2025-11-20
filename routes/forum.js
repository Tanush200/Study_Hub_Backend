// // backend/routes/forum.js
// const express = require("express");
// const router = express.Router();
// const Question = require("../models/Question");
// const Answer = require("../models/Answer");
// const User = require("../models/User");
// const XPService = require("../services/xpService");
// const auth = require("../middleware/auth");

// // Get all questions with filters
// router.get("/questions", async (req, res) => {
//   try {
//     const {
//       subject,
//       difficulty,
//       status,
//       search,
//       sortBy = "recent",
//       page = 1,
//       limit = 20,
//     } = req.query;

//     let query = { isDeleted: false };

//     // Apply filters
//     if (subject) query["category.subject"] = subject;
//     if (difficulty) query["category.difficulty"] = difficulty;
//     if (status) query.status = status;
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { content: { $regex: search, $options: "i" } },
//         { tags: { $in: [new RegExp(search, "i")] } },
//       ];
//     }

//     // Sort options
//     let sortOption = {};
//     switch (sortBy) {
//       case "popular":
//         sortOption = { upvotes: -1, views: -1 };
//         break;
//       case "unanswered":
//         query.answerCount = 0;
//         sortOption = { createdAt: -1 };
//         break;
//       case "answered":
//         query.answerCount = { $gt: 0 };
//         sortOption = { createdAt: -1 };
//         break;
//       default: // recent
//         sortOption = { createdAt: -1 };
//     }

//     const questions = await Question.find(query)
//       .populate("authorId", "username profile")
//       .sort(sortOption)
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .lean();

//     res.json(questions);
//   } catch (error) {
//     console.error("Get questions error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Create a new question
// router.post("/questions", auth, async (req, res) => {
//   try {
//     const { title, content, category, tags } = req.body;

//     const question = await Question.create({
//       title,
//       content,
//       authorId: req.user.id,
//       category,
//       tags: tags || [],
//     });

//     // Award XP for asking a question
//     await XPService.awardXP(
//       req.user.id,
//       "ASK_QUESTION", // Add this to XP_VALUES
//       5, // 5 XP for asking a question
//       question._id,
//       `Asked question: ${title}`
//     );

//     const populatedQuestion = await Question.findById(question._id).populate(
//       "authorId",
//       "username profile"
//     );

//     res.status(201).json(populatedQuestion);
//   } catch (error) {
//     console.error("Create question error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Get single question with answers
// router.get("/questions/:id", async (req, res) => {
//   try {
//     const question = await Question.findByIdAndUpdate(
//       req.params.id,
//       { $inc: { views: 1 } }, // Increment view count
//       { new: true }
//     ).populate("authorId", "username profile xp level");

//     if (!question || question.isDeleted) {
//       return res.status(404).json({ message: "Question not found" });
//     }

//     // Get answers for this question
//     const answers = await Answer.find({
//       questionId: req.params.id,
//       isDeleted: false,
//     })
//       .populate("authorId", "username profile xp level")
//       .sort({ isAccepted: -1, upvotes: -1, createdAt: 1 });

//     res.json({
//       question,
//       answers,
//     });
//   } catch (error) {
//     console.error("Get question error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Vote on a question
// router.post("/questions/:id/vote", auth, async (req, res) => {
//   try {
//     const { voteType } = req.body; // 'upvote' or 'downvote'
//     const questionId = req.params.id;
//     const userId = req.user.id;

//     const question = await Question.findById(questionId);
//     if (!question) {
//       return res.status(404).json({ message: "Question not found" });
//     }

//     // Remove previous vote if exists
//     const hadUpvote = question.upvotedBy.includes(userId);
//     const hadDownvote = question.downvotedBy.includes(userId);

//     if (hadUpvote) {
//       question.upvotedBy.pull(userId);
//       question.upvotes = Math.max(0, question.upvotes - 1);
//     }
//     if (hadDownvote) {
//       question.downvotedBy.pull(userId);
//       question.downvotes = Math.max(0, question.downvotes - 1);
//     }

//     // Add new vote if different from previous
//     if (voteType === "upvote" && !hadUpvote) {
//       question.upvotedBy.push(userId);
//       question.upvotes += 1;

//       // Award XP to question author for receiving upvote
//       if (question.authorId.toString() !== userId) {
//         await XPService.awardXP(
//           question.authorId,
//           "QUESTION_UPVOTED",
//           2,
//           questionId,
//           "Received upvote on question"
//         );
//       }
//     } else if (voteType === "downvote" && !hadDownvote) {
//       question.downvotedBy.push(userId);
//       question.downvotes += 1;
//     }

//     await question.save();
//     res.json({
//       upvotes: question.upvotes,
//       downvotes: question.downvotes,
//     });
//   } catch (error) {
//     console.error("Vote question error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.post("/questions/:id/answers", auth, async (req, res) => {
//   try {
//     const { content } = req.body;
//     const questionId = req.params.id;
//     const authorId = req.user.id;

//     // Check if question exists
//     const question = await Question.findById(questionId);
//     if (!question) {
//       return res.status(404).json({ message: "Question not found" });
//     }

//     // Create answer
//     const answer = await Answer.create({
//       content,
//       questionId,
//       authorId,
//     });

//     // Update question answer count
//     await Question.findByIdAndUpdate(questionId, {
//       $inc: { answerCount: 1 },
//     });

//     // Award XP for answering
//     await XPService.awardXP(
//       authorId,
//       "ANSWER_QUESTION",
//       10,
//       answer._id,
//       `Answered question: ${question.title}`
//     );

//     const populatedAnswer = await Answer.findById(answer._id).populate(
//       "authorId",
//       "username profile"
//     );

//     res.status(201).json(populatedAnswer);
//   } catch (error) {
//     console.error("Create answer error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Vote on an answer
// router.post("/answers/:id/vote", auth, async (req, res) => {
//   try {
//     const { voteType } = req.body;
//     const answerId = req.params.id;
//     const userId = req.user.id;

//     const answer = await Answer.findById(answerId);
//     if (!answer) {
//       return res.status(404).json({ message: "Answer not found" });
//     }

//     // Remove previous vote if exists
//     const hadUpvote = answer.upvotedBy.includes(userId);
//     const hadDownvote = answer.downvotedBy.includes(userId);

//     if (hadUpvote) {
//       answer.upvotedBy.pull(userId);
//       answer.upvotes = Math.max(0, answer.upvotes - 1);
//     }
//     if (hadDownvote) {
//       answer.downvotedBy.pull(userId);
//       answer.downvotes = Math.max(0, answer.downvotes - 1);
//     }

//     // Add new vote if different from previous
//     if (voteType === "upvote" && !hadUpvote) {
//       answer.upvotedBy.push(userId);
//       answer.upvotes += 1;

//       // Award XP to answer author for receiving upvote
//       if (answer.authorId.toString() !== userId) {
//         await XPService.awardXP(
//           answer.authorId,
//           "ANSWER_UPVOTED",
//           3,
//           answerId,
//           "Received upvote on answer"
//         );
//       }
//     } else if (voteType === "downvote" && !hadDownvote) {
//       answer.downvotedBy.push(userId);
//       answer.downvotes += 1;
//     }

//     await answer.save();
//     res.json({
//       upvotes: answer.upvotes,
//       downvotes: answer.downvotes,
//     });
//   } catch (error) {
//     console.error("Vote answer error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Get forum statistics
// router.get("/stats", async (req, res) => {
//   try {
//     const totalQuestions = await Question.countDocuments({ isDeleted: false });
//     const answeredQuestions = await Question.countDocuments({
//       isDeleted: false,
//       answerCount: { $gt: 0 },
//     });

//     // Top contributors (most answers given)
//     const topContributors = await Answer.aggregate([
//       { $match: { isDeleted: false } },
//       { $group: { _id: "$authorId", answerCount: { $sum: 1 } } },
//       { $sort: { answerCount: -1 } },
//       { $limit: 5 },
//       {
//         $lookup: {
//           from: "users",
//           localField: "_id",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       {
//         $project: {
//           username: "$user.username",
//           answerCount: 1,
//         },
//       },
//     ]);

//     res.json({
//       totalQuestions,
//       answeredQuestions,
//       topContributors,
//     });
//   } catch (error) {
//     console.error("Get forum stats error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;


// backend/routes/forum.js
const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const User = require("../models/User");
const XPService = require("../services/xpService");
const auth = require("../middleware/auth");

// Get all questions with filters
router.get("/questions", async (req, res) => {
  try {
    const {
      subject,
      difficulty,
      status,
      search,
      sortBy = "recent",
      page = 1,
      limit = 20,
    } = req.query;

    let query = { isDeleted: false };

    // Apply filters
    if (subject) query["category.subject"] = subject;
    if (difficulty) query["category.difficulty"] = difficulty;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sortBy) {
      case "popular":
        sortOption = { upvotes: -1, views: -1 };
        break;
      case "unanswered":
        query.answerCount = 0;
        sortOption = { createdAt: -1 };
        break;
      case "answered":
        query.answerCount = { $gt: 0 };
        sortOption = { createdAt: -1 };
        break;
      default: // recent
        sortOption = { createdAt: -1 };
    }

    const questions = await Question.find(query)
      .populate("authorId", "username profile")
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    res.json(questions);
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new question
router.post("/questions", auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    const question = await Question.create({
      title,
      content,
      authorId: req.user.id,
      category,
      tags: tags || [],
    });

    // Award XP for asking a question
    await XPService.awardXP(
      req.user.id,
      "ASK_QUESTION", // Add this to XP_VALUES
      5, // 5 XP for asking a question
      question._id,
      `Asked question: ${title}`
    );

    const populatedQuestion = await Question.findById(question._id).populate(
      "authorId",
      "username profile"
    );

    res.status(201).json(populatedQuestion);
  } catch (error) {
    console.error("Create question error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Updated Get single question with answers - FIXED VIEW COUNT
// backend/routes/forum.js - Update the GET questions/:id route
router.get("/questions/:id", async (req, res) => {
  try {
    const questionId = req.params.id;
    console.log('🔍 Getting question:', questionId);

    // Check if questionId is valid ObjectId format
    if (!questionId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid question ID format');
      return res.status(404).json({ message: "Invalid question ID" });
    }

    // Find question first without incrementing views
    const question = await Question.findById(questionId)
      .populate("authorId", "username profile xp level");

    if (!question || question.isDeleted) {
      console.log('❌ Question not found');
      return res.status(404).json({ message: "Question not found" });
    }

    console.log('✅ Question found:', question.title);
    console.log('📊 Current views:', question.views);
    console.log('👥 ViewedBy array:', question.viewedBy);

    // Get viewer ID - try multiple sources
    const viewerId = req.user?.id || req.user?._id || req.ip || req.connection?.remoteAddress || 'anonymous';
    console.log('👤 Viewer ID:', viewerId);
    console.log('🔐 User from auth:', req.user);
    console.log('🌐 IP address:', req.ip);

    // Initialize viewedBy array if it doesn't exist
    if (!question.viewedBy) {
      console.log('🔧 Initializing viewedBy array');
      question.viewedBy = [];
    }

    // Check if this viewer has already seen this question
    const hasViewed = question.viewedBy.some(viewer => viewer === String(viewerId));
    console.log('👁️ Has viewed before:', hasViewed);

    if (!hasViewed) {
      console.log(`🆕 New view from: ${viewerId}`);

      try {
        // Increment view count and add viewer
        const updateResult = await Question.findByIdAndUpdate(
          questionId,
          {
            $inc: { views: 1 },
            $push: { viewedBy: String(viewerId) }
          },
          { new: true }
        );

        console.log('✅ Update result views:', updateResult.views);
        console.log('✅ Update result viewedBy:', updateResult.viewedBy);

        // Update local question object for response
        question.views = updateResult.views;
        question.viewedBy = updateResult.viewedBy;

      } catch (updateError) {
        console.error('❌ Error updating views:', updateError);
      }
    } else {
      console.log(`👁️ Already viewed by: ${viewerId}`);
    }

    // Get answers for this question
    const answers = await Answer.find({
      questionId: questionId,
      isDeleted: false,
    })
      .populate("authorId", "username profile xp level")
      .sort({ isAccepted: -1, upvotes: -1, createdAt: 1 });

    console.log(`✅ Found ${answers.length} answers`);
    console.log('📤 Sending response with views:', question.views);

    res.json({
      question,
      answers,
    });
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Vote on a question
router.post("/questions/:id/vote", auth, async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const questionId = req.params.id;
    const userId = req.user.id;

    console.log('🗳️ Vote request:', {
      voteType,
      questionId,
      userId,
      userIdType: typeof userId
    });

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    console.log('📊 Current vote state:', {
      upvotes: question.upvotes,
      downvotes: question.downvotes,
      upvotedBy: question.upvotedBy.map(id => id.toString()),
      downvotedBy: question.downvotedBy.map(id => id.toString())
    });

    // Remove previous vote if exists (use proper ObjectId comparison)
    const hadUpvote = question.upvotedBy.some(id => id.toString() === userId);
    const hadDownvote = question.downvotedBy.some(id => id.toString() === userId);

    console.log('✅ Vote check:', { hadUpvote, hadDownvote });

    if (hadUpvote) {
      console.log('🔄 Removing previous upvote');
      question.upvotedBy.pull(userId);
      question.upvotes = Math.max(0, question.upvotes - 1);
    }
    if (hadDownvote) {
      console.log('🔄 Removing previous downvote');
      question.downvotedBy.pull(userId);
      question.downvotes = Math.max(0, question.downvotes - 1);
    }

    // Add new vote if different from previous
    if (voteType === "upvote" && !hadUpvote) {
      console.log('➕ Adding upvote');
      question.upvotedBy.push(userId);
      question.upvotes += 1;

      // Award XP to question author for receiving upvote
      if (question.authorId.toString() !== userId) {
        await XPService.awardXP(
          question.authorId,
          "QUESTION_UPVOTED",
          2,
          questionId,
          "Received upvote on question"
        );
      }
    } else if (voteType === "downvote" && !hadDownvote) {
      console.log('➖ Adding downvote');
      question.downvotedBy.push(userId);
      question.downvotes += 1;
    }

    console.log('💾 Saving with new state:', {
      upvotes: question.upvotes,
      downvotes: question.downvotes,
      upvotedBy: question.upvotedBy.map(id => id.toString()),
      downvotedBy: question.downvotedBy.map(id => id.toString())
    });

    await question.save();

    const response = {
      upvotes: question.upvotes,
      downvotes: question.downvotes,
    };

    console.log('📤 Sending response:', response);

    res.json(response);
  } catch (error) {
    console.error("Vote question error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Create answer for a question
router.post("/questions/:id/answers", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const questionId = req.params.id;
    const authorId = req.user.id;

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Create answer
    const answer = await Answer.create({
      content,
      questionId,
      authorId,
    });

    // Update question answer count
    await Question.findByIdAndUpdate(questionId, {
      $inc: { answerCount: 1 },
    });

    // Award XP for answering
    await XPService.awardXP(
      authorId,
      "ANSWER_QUESTION",
      10,
      answer._id,
      `Answered question: ${question.title}`
    );

    const populatedAnswer = await Answer.findById(answer._id).populate(
      "authorId",
      "username profile"
    );

    res.status(201).json(populatedAnswer);
  } catch (error) {
    console.error("Create answer error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Vote on an answer
router.post("/answers/:id/vote", auth, async (req, res) => {
  try {
    const { voteType } = req.body;
    const answerId = req.params.id;
    const userId = req.user.id;

    console.log('🗳️ Answer vote request:', {
      voteType,
      answerId,
      userId,
      userIdType: typeof userId
    });

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    console.log('📊 Current answer vote state:', {
      upvotes: answer.upvotes,
      downvotes: answer.downvotes,
      upvotedBy: answer.upvotedBy.map(id => id.toString()),
      downvotedBy: answer.downvotedBy.map(id => id.toString())
    });

    // Remove previous vote if exists (use proper ObjectId comparison)
    const hadUpvote = answer.upvotedBy.some(id => id.toString() === userId);
    const hadDownvote = answer.downvotedBy.some(id => id.toString() === userId);

    console.log('✅ Answer vote check:', { hadUpvote, hadDownvote });

    if (hadUpvote) {
      console.log('🔄 Removing previous upvote from answer');
      answer.upvotedBy.pull(userId);
      answer.upvotes = Math.max(0, answer.upvotes - 1);
    }
    if (hadDownvote) {
      console.log('🔄 Removing previous downvote from answer');
      answer.downvotedBy.pull(userId);
      answer.downvotes = Math.max(0, answer.downvotes - 1);
    }

    // Add new vote if different from previous
    if (voteType === "upvote" && !hadUpvote) {
      console.log('➕ Adding upvote to answer');
      answer.upvotedBy.push(userId);
      answer.upvotes += 1;

      // Award XP to answer author for receiving upvote
      if (answer.authorId.toString() !== userId) {
        await XPService.awardXP(
          answer.authorId,
          "ANSWER_UPVOTED",
          3,
          answerId,
          "Received upvote on answer"
        );
      }
    } else if (voteType === "downvote" && !hadDownvote) {
      console.log('➖ Adding downvote to answer');
      answer.downvotedBy.push(userId);
      answer.downvotes += 1;
    }

    console.log('💾 Saving answer with new state:', {
      upvotes: answer.upvotes,
      downvotes: answer.downvotes,
      upvotedBy: answer.upvotedBy.map(id => id.toString()),
      downvotedBy: answer.downvotedBy.map(id => id.toString())
    });

    await answer.save();

    const response = {
      upvotes: answer.upvotes,
      downvotes: answer.downvotes,
    };

    console.log('📤 Sending answer vote response:', response);

    res.json(response);
  } catch (error) {
    console.error("Vote answer error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Get forum statistics
router.get("/stats", async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments({ isDeleted: false });
    const answeredQuestions = await Question.countDocuments({
      isDeleted: false,
      answerCount: { $gt: 0 },
    });

    // Top contributors (most answers given)
    const topContributors = await Answer.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$authorId", answerCount: { $sum: 1 } } },
      { $sort: { answerCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          username: "$user.username",
          answerCount: 1,
        },
      },
    ]);

    res.json({
      totalQuestions,
      answeredQuestions,
      topContributors,
    });
  } catch (error) {
    console.error("Get forum stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// backend/routes/forum.js - Add these delete routes

// Delete a question (author or admin only)
router.delete("/questions/:id", auth, async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`🗑️ Delete request for question ${questionId} by user ${userId}`);

    // Find the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check permissions - author or admin can delete
    const isAuthor = question.authorId.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        message: "You can only delete your own questions"
      });
    }

    // Soft delete - mark as deleted instead of removing
    await Question.findByIdAndUpdate(questionId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    });

    // Also soft delete all associated answers
    await Answer.updateMany(
      { questionId: questionId },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    );

    console.log(`✅ Question ${questionId} deleted successfully`);

    res.json({
      message: "Question deleted successfully",
      questionId
    });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an answer (author or admin only)
router.delete("/answers/:id", auth, async (req, res) => {
  try {
    const answerId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`🗑️ Delete request for answer ${answerId} by user ${userId}`);

    // Find the answer
    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check permissions - author or admin can delete
    const isAuthor = answer.authorId.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        message: "You can only delete your own answers"
      });
    }

    // Soft delete the answer
    await Answer.findByIdAndUpdate(answerId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    });

    // Decrease question answer count
    await Question.findByIdAndUpdate(answer.questionId, {
      $inc: { answerCount: -1 }
    });

    console.log(`✅ Answer ${answerId} deleted successfully`);

    res.json({
      message: "Answer deleted successfully",
      answerId
    });
  } catch (error) {
    console.error("Delete answer error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's questions (for management)
router.get("/my-questions", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeDeleted = false } = req.query;

    let query = { authorId: userId };
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    const questions = await Question.find(query)
      .populate("authorId", "username profile")
      .sort({ createdAt: -1 })
      .lean();

    res.json(questions);
  } catch (error) {
    console.error("Get my questions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's answers (for management)
router.get("/my-answers", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeDeleted = false } = req.query;

    let query = { authorId: userId };
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    const answers = await Answer.find(query)
      .populate("authorId", "username profile")
      .populate("questionId", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json(answers);
  } catch (error) {
    console.error("Get my answers error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
