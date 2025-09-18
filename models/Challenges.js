
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
      }, 
      timeframe: {
        type: Number,
        required: true,
      }, 
    },


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
