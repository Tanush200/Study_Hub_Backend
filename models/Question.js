// // backend/models/Question.js
// const mongoose = require("mongoose");

// const questionSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 200,
//     },
//     content: {
//       type: String,
//       required: true,
//       maxlength: 5000,
//     },

//     // Author Information
//     authorId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // Categorization
//     category: {
//       subject: {
//         type: String,
//         required: true,
//       },
//       topic: String,
//       difficulty: {
//         type: String,
//         enum: ["beginner", "intermediate", "advanced"],
//         default: "beginner",
//       },
//       urgency: {
//         type: String,
//         enum: ["low", "medium", "high"],
//         default: "medium",
//       },
//     },

//     // Tags for better searchability
//     tags: [String],

//     // Question Status
//     status: {
//       type: String,
//       enum: ["open", "answered", "closed"],
//       default: "open",
//     },

//     // Engagement Metrics
//     views: {
//       type: Number,
//       default: 0,
//     },
//     upvotes: {
//       type: Number,
//       default: 0,
//     },
//     downvotes: {
//       type: Number,
//       default: 0,
//     },
//     upvotedBy: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],
//     downvotedBy: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     // Best Answer
//     bestAnswerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Answer",
//     },

//     // Additional Features
//     bounty: {
//       amount: {
//         type: Number,
//         default: 0,
//       },
//       offeredBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     },

//     // Answer Statistics
//     answerCount: {
//       type: Number,
//       default: 0,
//     },

//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Indexes for efficient searching
// questionSchema.index({ "category.subject": 1, status: 1 });
// questionSchema.index({ authorId: 1 });
// questionSchema.index({ tags: 1 });
// questionSchema.index({ createdAt: -1 });
// questionSchema.index({ upvotes: -1, views: -1 });

// module.exports = mongoose.model("Question", questionSchema);



// backend/models/Question.js
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

    // Author Information
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Categorization
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

    // Tags for better searchability
    tags: [String],

    // Question Status
    status: {
      type: String,
      enum: ["open", "answered", "closed"],
      default: "open",
    },

    // Engagement Metrics
    views: {
      type: Number,
      default: 0,
    },

    // ✅ Add field to track who viewed the question
    viewedBy: [
      {
        type: String, // Will store user IDs or IP addresses
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

    // Best Answer
    bestAnswerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },

    // Additional Features
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

    // Answer Statistics
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

    // ✅ Add these new fields
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

// Indexes for efficient searching
questionSchema.index({ "category.subject": 1, status: 1 });
questionSchema.index({ authorId: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ upvotes: -1, views: -1 });

module.exports = mongoose.model("Question", questionSchema);
