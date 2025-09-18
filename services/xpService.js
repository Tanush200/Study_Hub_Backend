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


  static async awardXP(userId, action, xpAmount = null, relatedId = null, description = '') {
    try {
      const earnedXP = xpAmount || this.XP_VALUES[action] || 0;
      
 
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const oldXP = user.xp;
      const newXP = oldXP + earnedXP;
      const oldLevel = Math.floor(oldXP / 100) + 1;
      const newLevel = Math.floor(newXP / 100) + 1;


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


      await XPTransaction.create({
        userId,
        action,
        xpEarned: earnedXP,
        relatedId,
        description: description || `Earned ${earnedXP} XP for ${action}`
      });

 
      const badgeResults = await this.checkAndAwardBadges(userId, newXP, action);
      

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


  static async checkAndAwardBadges(userId, currentXP, action) {
    try {
      const user = await User.findById(userId)
        .populate('badges.badgeId')
        .populate('stats');
        
      const earnedBadgeIds = user.badges.map(b => b.badgeId?._id?.toString()).filter(Boolean);


      const eligibleBadges = await Badge.find({
        _id: { $nin: earnedBadgeIds },
        isActive: true,
        $or: [
          { 'requirements.xpThreshold': { $lte: currentXP } },
          { 'requirements.notesUploaded': { $lte: user.stats.notesUploaded } },
      
        ]
      });

      const newBadges = [];

      for (const badge of eligibleBadges) {
        let qualifies = false;

 
        if (badge.requirements.xpThreshold && currentXP >= badge.requirements.xpThreshold) {
          qualifies = true;
        }

 
        if (badge.requirements.notesUploaded && user.stats.notesUploaded >= badge.requirements.notesUploaded) {
          qualifies = true;
        }

        if (qualifies) {

          await User.findByIdAndUpdate(userId, {
            $push: {
              badges: {
                badgeId: badge._id,
                earnedAt: new Date()
              }
            }
          });


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


  static async updateChallengeProgress(userId, action) {
    try {
      const user = await User.findById(userId);
      const activeDate = new Date();
      

      const Challenge = require('../models/Challenge');
      const activeChallenges = await Challenge.find({
        isActive: true,
        startDate: { $lte: activeDate },
        endDate: { $gte: activeDate },
        'requirements.action': action
      });

      for (const challenge of activeChallenges) {

        let challengeProgress = user.challengeProgress.find(
          cp => cp.challengeId.toString() === challenge._id.toString()
        );

        if (!challengeProgress) {

          challengeProgress = {
            challengeId: challenge._id,
            progress: 0,
            completed: false
          };
          user.challengeProgress.push(challengeProgress);
        }

        if (!challengeProgress.completed) {
      
          challengeProgress.progress += 1;

    
          if (challengeProgress.progress >= challenge.requirements.target) {
            challengeProgress.completed = true;
            challengeProgress.completedAt = new Date();

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
