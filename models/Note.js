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


    file: {
      s3Key: String,
      originalName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number,
      thumbnail: String,
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
      tags: [String],

      lastViewedAt: Date,
      downloadCount: { type: Number, default: 0 },
      shareCount: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectedReason: { type: String, default: null },


    processingStatus: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "completed",
    },
    forumPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


noteSchema.index({ "metadata.likedBy": 1 });
noteSchema.index({ "metadata.dislikedBy": 1 });
noteSchema.index({ "file.s3Key": 1 });
noteSchema.index({ "file.format": 1 });
noteSchema.index({ "metadata.lastViewedAt": -1 });
noteSchema.index({ status: 1, createdAt: -1 });


noteSchema.virtual("metadata.totalInteractions").get(function () {
  return this.metadata.likes + this.metadata.dislikes + this.metadata.views;
});


noteSchema.pre("save", function (next) {
  if (this.isNew && !this.file.s3Key) {
    this.processingStatus = "processing";
  }
  next();
});

module.exports = mongoose.model("Note", noteSchema);







