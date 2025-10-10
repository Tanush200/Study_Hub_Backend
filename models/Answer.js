
const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 3000,
    },


    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    
    parentAnswerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },


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


    isAccepted: {
      type: Boolean,
      default: false,
    },

    
    attachments: [
      {
        filename: String,
        url: String,
        fileType: String,
      },
    ],

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
  },
  {
    timestamps: true,
  }
);


answerSchema.index({ questionId: 1, createdAt: -1 });
answerSchema.index({ authorId: 1 });
answerSchema.index({ upvotes: -1 });

module.exports = mongoose.model("Answer", answerSchema);
