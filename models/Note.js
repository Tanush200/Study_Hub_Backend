// const mongoose = require("mongoose");

// const noteSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 200,
//     },
//     description: {
//       type: String,
//       trim: true,
//       maxlength: 1000,
//     },
//     uploaderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     category: {
//       subject: String,
//       topic: String,
//       examType: {
//         type: String,
//         enum: ["semester", "competitive", "entrance"],
//         default: "semester",
//       },
//       class: String,
//       university: String,
//     },
//     file: {
//       cloudinaryId: String,
//       originalName: String,
//       fileUrl: String,
//       fileType: String,
//       fileSize: Number,
//       thumbnail: String,
//     },
//     metadata: {
//       views: { type: Number, default: 0 },
//       downloads: { type: Number, default: 0 },
//       likes: { type: Number, default: 0 },
//       dislikes: { type: Number, default: 0 },
//       likedBy:[
//         {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "User"
//         }
//       ],
//       dislikedBy:[
//         {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "User"
//         }
//       ],
//       averageRating: { type: Number, default: 0 },
//       tags: [String],
//     },
//     status: {
//       type: String,
//       enum: ["pending", "approved", "rejected"],
//       default: "pending",
//     },
//     rejectedReason: { type: String,default:null },
//   },
//   {
//     timestamps: true,
//   }
// );


// noteSchema.index({'metadata.likedBy': 1});
// noteSchema.index({'metadata.dislikedBy': 1});

// module.exports = mongoose.model("Note", noteSchema);


const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      subject: String,
      topic: String,
      examType: {
        type: String,
        enum: ["semester", "competitive", "entrance"],
        default: "semester",
      },
      class: String,
      university: String,
    },

    // ✅ UPDATED: File section for ImageKit
    file: {
      imagekitId: String, // ✅ Changed from cloudinaryId
      originalName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number,
      thumbnail: String,

      // ✅ NEW: Additional ImageKit metadata fields
      height: Number, // Image/video height in pixels
      width: Number, // Image/video width in pixels
      format: String, // File format (jpg, png, pdf, etc.)
      versionInfo: {
        // ✅ NEW: Version tracking
        id: String,
        name: String,
      },
      AITags: [String], // ✅ NEW: Auto-generated AI tags from ImageKit
      isPrivateFile: {
        // ✅ NEW: Privacy setting
        type: Boolean,
        default: false,
      },
    },

    metadata: {
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      dislikes: { type: Number, default: 0 },
      likedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      dislikedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      averageRating: { type: Number, default: 0 },
      tags: [String], // Manual tags

      // ✅ NEW: Enhanced metadata for better analytics
      lastViewedAt: Date, // Track recent activity
      downloadCount: { type: Number, default: 0 },
      shareCount: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectedReason: { type: String, default: null },

    // ✅ NEW: Processing status for ImageKit transformations
    processingStatus: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

// ✅ UPDATED: Add indexes for better query performance
noteSchema.index({ "metadata.likedBy": 1 });
noteSchema.index({ "metadata.dislikedBy": 1 });
noteSchema.index({ "file.imagekitId": 1 }); // New index for ImageKit ID
noteSchema.index({ "file.format": 1 }); // Index for file format queries
noteSchema.index({ "metadata.lastViewedAt": -1 }); // Index for recent activity
noteSchema.index({ status: 1, createdAt: -1 }); // Compound index for status queries

// ✅ NEW: Virtual for calculating total interactions
noteSchema.virtual("metadata.totalInteractions").get(function () {
  return this.metadata.likes + this.metadata.dislikes + this.metadata.views;
});

// ✅ NEW: Pre-save middleware to update processing status
noteSchema.pre("save", function (next) {
  if (this.isNew && !this.file.imagekitId) {
    this.processingStatus = "processing";
  }
  next();
});

module.exports = mongoose.model("Note", noteSchema);







