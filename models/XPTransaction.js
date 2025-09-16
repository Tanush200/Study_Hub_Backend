// backend/models/XPTransaction.js
const mongoose = require("mongoose");

const xpTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "upload",
        "review",
        "comment",
        "bookmark",
        "challenge_complete",
        "badge_earned",
      ],
      required: true,
    },
    xpEarned: {
      type: Number,
      required: true,
    },
    relatedId: mongoose.Schema.Types.ObjectId, // noteId, commentId, etc.
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("XPTransaction", xpTransactionSchema);
