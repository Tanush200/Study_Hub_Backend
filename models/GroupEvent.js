const mongoose = require("mongoose");

const groupEventSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
            index: true,
        },
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        location: {
            type: String, // Can be a URL (for online) or physical location
            trim: true,
        },
        attendees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isCancelled: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("GroupEvent", groupEventSchema);
