// backend/routes/gamification.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Badge = require("../models/Badge");
const Challenge = require("../models/Challenge");
const XPService = require("../services/xpService");
const auth = require("../middleware/auth");

// Get user's gamification profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("badges.badgeId")
      .select("username xp level badges monthlyStats challengeProgress");

    const level = Math.floor(user.xp / 100) + 1;
    const xpForNextLevel = level * 100 - user.xp;

    res.json({
      username: user.username,
      xp: user.xp,
      level,
      xpForNextLevel,
      badges: user.badges,
      monthlyStats: user.monthlyStats,
      challengeProgress: user.challengeProgress,
    });
  } catch (error) {
    console.error("Get gamification profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const { type = "overall", limit = 50 } = req.query;
    let matchCriteria = {};
    let sortCriteria = {};

    if (type === "monthly") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      matchCriteria = { "monthlyStats.currentMonth": currentMonth };
      sortCriteria = { "monthlyStats.monthlyXP": -1 };
    } else {
      sortCriteria = { xp: -1 };
    }

    const leaderboard = await User.aggregate([
      { $match: matchCriteria },
      { $sort: sortCriteria },
      { $limit: parseInt(limit) },
      {
        $project: {
          username: 1,
          xp: 1,
          level: { $add: [{ $floor: { $divide: ["$xp", 100] } }, 1] },
          monthlyXP: "$monthlyStats.monthlyXP",
          badgeCount: { $size: "$badges" },
        },
      },
    ]);

    // Add ranking
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    res.json({
      type,
      leaderboard: rankedLeaderboard,
      total: rankedLeaderboard.length,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's rank
router.get("/rank", auth, async (req, res) => {
  try {
    const { type = "overall" } = req.query;
    const userId = req.user.id;

    let pipeline = [];

    if (type === "monthly") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      pipeline = [
        { $match: { "monthlyStats.currentMonth": currentMonth } },
        { $sort: { "monthlyStats.monthlyXP": -1 } },
      ];
    } else {
      pipeline = [{ $sort: { xp: -1 } }];
    }

    const users = await User.aggregate(pipeline);
    const userRank =
      users.findIndex((user) => user._id.toString() === userId) + 1;

    res.json({
      rank: userRank || "Not ranked",
      totalUsers: users.length,
    });
  } catch (error) {
    console.error("Get user rank error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get active challenges
router.get("/challenges", auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const challenges = await Challenge.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // Get user's progress for each challenge
    const user = await User.findById(req.user.id);
    const challengesWithProgress = challenges.map((challenge) => {
      const userProgress = user.challengeProgress.find(
        (cp) => cp.challengeId.toString() === challenge._id.toString()
      );

      return {
        ...challenge.toObject(),
        userProgress: userProgress ? userProgress.progress : 0,
        completed: userProgress ? userProgress.completed : false,
        completedAt: userProgress ? userProgress.completedAt : null,
      };
    });

    res.json(challengesWithProgress);
  } catch (error) {
    console.error("Get challenges error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Award manual XP (admin only)
router.post("/award-xp", auth, async (req, res) => {
  try {
    // Add admin check here
    const { userId, action, xpAmount, description } = req.body;

    const result = await XPService.awardXP(
      userId,
      action,
      xpAmount,
      null,
      description
    );

    if (result.success) {
      res.json({
        message: "XP awarded successfully",
        ...result,
      });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error("Award XP error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
