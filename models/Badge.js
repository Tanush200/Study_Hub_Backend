
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
    }, 
    category: {
      type: String,
      enum: ["upload", "engagement", "streak", "milestone", "special"],
      required: true,
    },


    requirements: {
      xpThreshold: Number,
      notesUploaded: Number,
      daysStreak: Number,
      likesReceived: Number,
      custom: String, 
    },

    
    rewards: {
      xpBonus: { type: Number, default: 0 },
      title: String,
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
