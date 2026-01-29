
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },


    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },


    category: {
      subject: {
        type: String,
        required: true,
      },
      topic: String,
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner",
      },
      urgency: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
    },


    tags: [String],


    status: {
      type: String,
      enum: ["open", "answered", "closed"],
      default: "open",
    },


    views: {
      type: Number,
      default: 0,
    },


    viewedBy: [
      {
        type: String,
      },
    ],

    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],


    bestAnswerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },


    bounty: {
      amount: {
        type: Number,
        default: 0,
      },
      offeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },


    answerCount: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },


    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


questionSchema.index({ "category.subject": 1, status: 1 });
questionSchema.index({ authorId: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ upvotes: -1, views: -1 });

module.exports = mongoose.model("Question", questionSchema);
