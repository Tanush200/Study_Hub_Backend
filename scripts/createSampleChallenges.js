// backend/scripts/createSampleChallenges.js
const mongoose = require("mongoose");
const Challenge = require("../models/Challenges");
require("dotenv").config();

const sampleChallenges = [
  {
    title: "Weekly Upload Challenge",
    description: "Upload 3 notes this week to earn bonus XP!",
    icon: "📝",
    type: "weekly",
    requirements: {
      action: "upload",
      target: 3,
      timeframe: 7,
    },
    rewards: {
      xp: 100,
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    isActive: true,
  },
  {
    title: "Comment Enthusiast",
    description: "Leave 10 helpful comments on notes!",
    icon: "💬",
    type: "weekly",
    requirements: {
      action: "comment",
      target: 10,
      timeframe: 7,
    },
    rewards: {
      xp: 75,
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    title: "Bookmark Collector",
    description: "Bookmark 5 useful notes for future reference!",
    icon: "🔖",
    type: "weekly",
    requirements: {
      action: "bookmark",
      target: 5,
      timeframe: 7,
    },
    rewards: {
      xp: 50,
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
];

async function createSampleChallenges() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing challenges (optional)
    console.log("🗑️ Clearing existing challenges...");
    await Challenge.deleteMany({});

    // Create new challenges
    console.log("⚡ Creating sample challenges...");
    const challenges = await Challenge.insertMany(sampleChallenges);

    console.log(`✅ Created ${challenges.length} challenges:`);
    challenges.forEach((challenge) => {
      console.log(`  - ${challenge.icon} ${challenge.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating challenges:", error);
    process.exit(1);
  }
}

createSampleChallenges();
