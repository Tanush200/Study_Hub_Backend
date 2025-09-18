
const mongoose = require("mongoose");
const User = require("../models/User");
const Badge = require("../models/Badge");
require("dotenv").config();

async function awardBadgesToUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");


    const user = await User.findOne({ username: "Tanush_05" });
    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log(`👤 User: ${user.username} with ${user.xp} XP`);

    const eligibleBadges = await Badge.find({
      "requirements.xpThreshold": { $lte: user.xp },
      isActive: true,
    });

    console.log(`🏆 Found ${eligibleBadges.length} badges user qualifies for:`);


    for (const badge of eligibleBadges) {
   
      const alreadyHas = user.badges.some(
        (b) => b.badgeId.toString() === badge._id.toString()
      );

      if (!alreadyHas) {
        user.badges.push({
          badgeId: badge._id,
          earnedAt: new Date(),
        });
        console.log(`  ✅ Awarded: ${badge.icon} ${badge.name}`);
      } else {
        console.log(`  ⏭️ Already has: ${badge.icon} ${badge.name}`);
      }
    }

    await user.save();
    console.log(`🎉 User now has ${user.badges.length} badges total!`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

awardBadgesToUser();
