// backend/services/xpService.js
const User = require("../models/User");
const XPTransaction = require("../models/XPTransaction");
const Badge = require("../models/Badge");

class XPService {
  // XP values for different actions
  static XP_VALUES = {
    UPLOAD_NOTE: 15,
    REVIEW_NOTE: 5,
    COMMENT: 3,
    BOOKMARK: 1,
    DAILY_LOGIN: 2,
  };

  // Award XP to user
  static async awardXP(
    userId,
    action,
    xpAmount = null,
    relatedId = null,
    description = ""
  ) {
    try {
      const earnedXP = xpAmount || this.XP_VALUES[action] || 0;

      // Update user's total XP and monthly XP
      const currentMonth = new Date().toISOString().slice(0, 7); // "2025-09"

      const user = await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            xp: earnedXP,
            "monthlyStats.monthlyXP": earnedXP,
          },
          $set: {
            "monthlyStats.currentMonth": currentMonth,
          },
        },
        { new: true }
      );

      // Log the XP transaction
      await XPTransaction.create({
        userId,
        action,
        xpEarned: earnedXP,
        relatedId,
        description: description || `Earned ${earnedXP} XP for ${action}`,
      });

      // Check for new badges
      await this.checkAndAwardBadges(userId, user.xp);

      return {
        success: true,
        newXP: user.xp,
        earnedXP,
        newLevel: Math.floor(user.xp / 100) + 1,
      };
    } catch (error) {
      console.error("Error awarding XP:", error);
      return { success: false, error: error.message };
    }
  }

  // Check and award badges based on criteria
  static async checkAndAwardBadges(userId, currentXP) {
    try {
      const user = await User.findById(userId).populate("badges.badgeId");
      const earnedBadgeIds = user.badges.map((b) => b.badgeId._id.toString());

      // Get all available badges that user hasn't earned yet
      const availableBadges = await Badge.find({
        _id: { $nin: earnedBadgeIds },
        isActive: true,
        "requirements.xpThreshold": { $lte: currentXP },
      });

      // Award new badges
      for (const badge of availableBadges) {
        await User.findByIdAndUpdate(userId, {
          $push: {
            badges: {
              badgeId: badge._id,
              earnedAt: new Date(),
            },
          },
        });

        // Award bonus XP if badge has rewards
        if (badge.rewards.xpBonus > 0) {
          await this.awardXP(
            userId,
            "badge_earned",
            badge.rewards.xpBonus,
            badge._id,
            `Bonus XP for earning ${badge.name} badge`
          );
        }

        console.log(`Badge "${badge.name}" awarded to user ${userId}`);
      }
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  }
}

module.exports = XPService;
