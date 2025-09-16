// backend/scripts/checkBadges.js
const mongoose = require("mongoose");
const Badge = require("../models/Badge");
require("dotenv").config();

async function checkBadges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const badges = await Badge.find({});
    console.log(`📊 Found ${badges.length} badges in database:`);

    badges.forEach((badge) => {
      console.log(
        `  - ${badge.icon} ${badge.name} (XP: ${
          badge.requirements.xpThreshold || "N/A"
        })`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkBadges();
