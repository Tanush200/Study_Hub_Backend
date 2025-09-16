// backend/scripts/createSampleBadges.js
const mongoose = require("mongoose");
const Badge = require("../models/Badge");
require("dotenv").config();

const sampleBadges = [
  {
    name: "First Steps",
    description: "Welcome to StudyHub! Uploaded your first note.",
    icon: "🎯",
    category: "milestone",
    requirements: { xpThreshold: 0 },
    rewards: { xpBonus: 10 },
    rarity: "common",
  },
  {
    name: "Getting Started",
    description: "Earned your first 50 XP points!",
    icon: "⭐",
    category: "milestone",
    requirements: { xpThreshold: 50 },
    rewards: { xpBonus: 25 },
    rarity: "common",
  },
  {
    name: "Study Warrior",
    description: "Reached 100 XP. You're getting the hang of this!",
    icon: "⚔️",
    category: "milestone",
    requirements: { xpThreshold: 100 },
    rewards: { xpBonus: 50 },
    rarity: "rare",
  },
  {
    name: "XP Champion",
    description: "Reached 250 XP. You're on fire! 🔥",
    icon: "🏆",
    category: "milestone",
    requirements: { xpThreshold: 250 },
    rewards: { xpBonus: 100 },
    rarity: "epic",
  },
  {
    name: "Study Legend",
    description: "Reached 500 XP. Legendary status!",
    icon: "👑",
    category: "milestone",
    requirements: { xpThreshold: 500 },
    rewards: { xpBonus: 200 },
    rarity: "legendary",
  },
];

async function createSampleBadges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing badges
    await Badge.deleteMany({});
    console.log("🗑️ Cleared existing badges");

    // Create new badges
    const badges = await Badge.insertMany(sampleBadges);
    console.log(`✅ Created ${badges.length} badges:`);

    badges.forEach((badge) => {
      console.log(
        `  - ${badge.icon} ${badge.name} (${badge.requirements.xpThreshold} XP)`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating badges:", error);
    process.exit(1);
  }
}

createSampleBadges();
