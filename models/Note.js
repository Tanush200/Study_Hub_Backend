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
      cloudinaryId: String,
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
      averageRating: { type: Number, default: 0 },
      tags: [String],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectedReason: { type: String,default:null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Note", noteSchema);
