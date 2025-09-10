// backend/models/Challenge.js
const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },

    // Challenge type and requirements
    type: {
      type: String,
      enum: ["weekly", "monthly", "daily", "seasonal"],
      required: true,
    },
    requirements: {
      action: {
        type: String,
        enum: ["upload", "review", "comment", "bookmark", "login"],
        required: true,
      },
      target: {
        type: Number,
        required: true,
      }, // e.g., upload 5 notes
      timeframe: {
        type: Number,
        required: true,
      }, // days
    },

    // Rewards for completion
    rewards: {
      xp: {
        type: Number,
        required: true,
      },
      badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Badge",
      },
    },

    // Challenge timing
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Challenge", challengeSchema);
