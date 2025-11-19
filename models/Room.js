const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        topic: {
            type: String,
            default: "General Study",
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
        password: {
            type: String, // Hashed password
        },
        activeUsers: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        messages: [
            {
                sender: String,
                message: String,
                time: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],
        whiteboardData: [
            {
                x0: Number,
                y0: Number,
                x1: Number,
                y1: Number,
                color: String,
                size: Number,
                tool: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Room", roomSchema);
