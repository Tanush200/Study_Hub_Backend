const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const groupPostSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
            index: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        attachments: [
            {
                type: String, // URL of the attachment
            },
        ],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        comments: [commentSchema],
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("GroupPost", groupPostSchema);
