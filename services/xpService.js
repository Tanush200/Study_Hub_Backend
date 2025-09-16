// // backend/services/xpService.js
// const User = require("../models/User");
// const XPTransaction = require("../models/XPTransaction");
// const Badge = require("../models/Badge");

// class XPService {
//   // XP values for different actions
//   static XP_VALUES = {
//     UPLOAD_NOTE: 15,
//     REVIEW_NOTE: 5,
//     COMMENT: 3,
//     BOOKMARK: 1,
//     DAILY_LOGIN: 2,
//   };

//   // Award XP to user
//   static async awardXP(
//     userId,
//     action,
//     xpAmount = null,
//     relatedId = null,
//     description = ""
//   ) {
//     try {
//       const earnedXP = xpAmount || this.XP_VALUES[action] || 0;

//       // Update user's total XP and monthly XP
//       const currentMonth = new Date().toISOString().slice(0, 7); // "2025-09"

//       const user = await User.findByIdAndUpdate(
//         userId,
//         {
//           $inc: {
//             xp: earnedXP,
//             "monthlyStats.monthlyXP": earnedXP,
//           },
//           $set: {
//             "monthlyStats.currentMonth": currentMonth,
//           },
//         },
//         { new: true }
//       );

//       // Log the XP transaction
//       await XPTransaction.create({
//         userId,
//         action,
//         xpEarned: earnedXP,
//         relatedId,
//         description: description || `Earned ${earnedXP} XP for ${action}`,
//       });

//       // Check for new badges
//       await this.checkAndAwardBadges(userId, user.xp);

//       return {
//         success: true,
//         newXP: user.xp,
//         earnedXP,
//         newLevel: Math.floor(user.xp / 100) + 1,
//       };
//     } catch (error) {
//       console.error("Error awarding XP:", error);
//       return { success: false, error: error.message };
//     }
//   }

//   // Check and award badges based on criteria
//   static async checkAndAwardBadges(userId, currentXP) {
//     try {
//       const user = await User.findById(userId).populate("badges.badgeId");
//       const earnedBadgeIds = user.badges.map((b) => b.badgeId._id.toString());

//       // Get all available badges that user hasn't earned yet
//       const availableBadges = await Badge.find({
//         _id: { $nin: earnedBadgeIds },
//         isActive: true,
//         "requirements.xpThreshold": { $lte: currentXP },
//       });

//       // Award new badges
//       for (const badge of availableBadges) {
//         await User.findByIdAndUpdate(userId, {
//           $push: {
//             badges: {
//               badgeId: badge._id,
//               earnedAt: new Date(),
//             },
//           },
//         });

//         // Award bonus XP if badge has rewards
//         if (badge.rewards.xpBonus > 0) {
//           await this.awardXP(
//             userId,
//             "badge_earned",
//             badge.rewards.xpBonus,
//             badge._id,
//             `Bonus XP for earning ${badge.name} badge`
//           );
//         }

//         console.log(`Badge "${badge.name}" awarded to user ${userId}`);
//       }
//     } catch (error) {
//       console.error("Error checking badges:", error);
//     }
//   }
// }

// module.exports = XPService;



// backend/services/xpService.js - Enhanced version
const User = require('../models/User');
const Badge = require('../models/Badge');
const XPTransaction = require('../models/XPTransaction');

class XPService {
  static XP_VALUES = {
    UPLOAD_NOTE: 15,
    COMMENT: 3,
    BOOKMARK: 1,
    DAILY_LOGIN: 2,
    LIKE_RECEIVED: 1
  };

  // ✅ Enhanced XP awarding with automatic badge checking
  static async awardXP(userId, action, xpAmount = null, relatedId = null, description = '') {
    try {
      const earnedXP = xpAmount || this.XP_VALUES[action] || 0;
      
      // Get user's current data
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const oldXP = user.xp;
      const newXP = oldXP + earnedXP;
      const oldLevel = Math.floor(oldXP / 100) + 1;
      const newLevel = Math.floor(newXP / 100) + 1;

      // Update user XP and monthly stats
      const currentMonth = new Date().toISOString().slice(0, 7);
      await User.findByIdAndUpdate(userId, {
        $inc: { 
          xp: earnedXP,
          'monthlyStats.monthlyXP': earnedXP
        },
        $set: {
          'monthlyStats.currentMonth': currentMonth,
          level: newLevel
        }
      });

      // Log XP transaction
      await XPTransaction.create({
        userId,
        action,
        xpEarned: earnedXP,
        relatedId,
        description: description || `Earned ${earnedXP} XP for ${action}`
      });

      // ✅ AUTOMATICALLY CHECK AND AWARD BADGES
      const badgeResults = await this.checkAndAwardBadges(userId, newXP, action);
      
      // ✅ UPDATE CHALLENGE PROGRESS
      await this.updateChallengeProgress(userId, action);

      console.log(`💰 User ${userId} earned ${earnedXP} XP for ${action}. Total: ${newXP} XP`);
      
      return {
        success: true,
        earnedXP,
        newXP,
        oldLevel,
        newLevel,
        leveledUp: newLevel > oldLevel,
        newBadges: badgeResults.newBadges,
        completedChallenges: badgeResults.completedChallenges || []
      };

    } catch (error) {
      console.error('Error awarding XP:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Enhanced badge checking with real criteria
  static async checkAndAwardBadges(userId, currentXP, action) {
    try {
      const user = await User.findById(userId)
        .populate('badges.badgeId')
        .populate('stats');
        
      const earnedBadgeIds = user.badges.map(b => b.badgeId?._id?.toString()).filter(Boolean);

      // Get eligible badges based on multiple criteria
      const eligibleBadges = await Badge.find({
        _id: { $nin: earnedBadgeIds },
        isActive: true,
        $or: [
          { 'requirements.xpThreshold': { $lte: currentXP } },
          { 'requirements.notesUploaded': { $lte: user.stats.notesUploaded } },
          // Add more criteria as needed
        ]
      });

      const newBadges = [];

      // Award eligible badges
      for (const badge of eligibleBadges) {
        let qualifies = false;

        // Check XP threshold
        if (badge.requirements.xpThreshold && currentXP >= badge.requirements.xpThreshold) {
          qualifies = true;
        }

        // Check notes uploaded
        if (badge.requirements.notesUploaded && user.stats.notesUploaded >= badge.requirements.notesUploaded) {
          qualifies = true;
        }

        if (qualifies) {
          // Award badge
          await User.findByIdAndUpdate(userId, {
            $push: {
              badges: {
                badgeId: badge._id,
                earnedAt: new Date()
              }
            }
          });

          // Award bonus XP if badge has rewards
          if (badge.rewards?.xpBonus > 0) {
            await User.findByIdAndUpdate(userId, {
              $inc: { xp: badge.rewards.xpBonus }
            });
          }

          newBadges.push(badge);
          console.log(`🏆 Badge "${badge.name}" awarded to user ${userId}`);
        }
      }

      return { newBadges };
    } catch (error) {
      console.error('Error checking badges:', error);
      return { newBadges: [] };
    }
  }

  // ✅ NEW: Challenge progress tracking
  static async updateChallengeProgress(userId, action) {
    try {
      const user = await User.findById(userId);
      const activeDate = new Date();
      
      // Find active challenges for this action
      const Challenge = require('../models/Challenge');
      const activeChallenges = await Challenge.find({
        isActive: true,
        startDate: { $lte: activeDate },
        endDate: { $gte: activeDate },
        'requirements.action': action
      });

      for (const challenge of activeChallenges) {
        // Find user's progress for this challenge
        let challengeProgress = user.challengeProgress.find(
          cp => cp.challengeId.toString() === challenge._id.toString()
        );

        if (!challengeProgress) {
          // Create new progress entry
          challengeProgress = {
            challengeId: challenge._id,
            progress: 0,
            completed: false
          };
          user.challengeProgress.push(challengeProgress);
        }

        if (!challengeProgress.completed) {
          // Increment progress
          challengeProgress.progress += 1;

          // Check if challenge is completed
          if (challengeProgress.progress >= challenge.requirements.target) {
            challengeProgress.completed = true;
            challengeProgress.completedAt = new Date();

            // Award challenge rewards
            if (challenge.rewards.xp > 0) {
              await User.findByIdAndUpdate(userId, {
                $inc: { xp: challenge.rewards.xp }
              });
              console.log(`⚡ Challenge "${challenge.title}" completed! +${challenge.rewards.xp} XP`);
            }
          }
        }
      }

      await user.save();
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  }
}

module.exports = XPService;
