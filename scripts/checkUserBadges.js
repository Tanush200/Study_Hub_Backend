// backend/scripts/checkUserBadges.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Badge = require("../models/Badge");
require("dotenv").config();

async function checkUserBadges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Replace 'Tanush_05' with your actual username
    const user = await User.findOne({ username: "Tanush_05" }).populate(
      "badges.badgeId"
    );

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log(`👤 User: ${user.username}`);
    console.log(`⭐ XP: ${user.xp}`);
    console.log(`🏆 Badges: ${user.badges?.length || 0}`);

    if (user.badges?.length > 0) {
      console.log("📜 User badges:");
      user.badges.forEach((badge) => {
        console.log(
          `  - ${badge.badgeId?.icon || "❓"} ${
            badge.badgeId?.name || "Unknown"
          } (Earned: ${badge.earnedAt})`
        );
      });
    } else {
      console.log("🚫 No badges found for user");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkUserBadges();
