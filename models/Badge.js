// backend/models/Badge.js
const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    }, // emoji or image URL
    category: {
      type: String,
      enum: ["upload", "engagement", "streak", "milestone", "special"],
      required: true,
    },

    // Badge requirements
    requirements: {
      xpThreshold: Number,
      notesUploaded: Number,
      daysStreak: Number,
      likesReceived: Number,
      custom: String, // for special conditions
    },

    // Badge rewards
    rewards: {
      xpBonus: { type: Number, default: 0 },
      title: String, // special user title
    },

    rarity: {
      type: String,
      enum: ["common", "rare", "epic", "legendary"],
      default: "common",
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

module.exports = mongoose.model("Badge", badgeSchema);
