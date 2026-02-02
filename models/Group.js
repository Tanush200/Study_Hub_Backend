const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            maxlength: 500,
        },
        subject: {
            type: String,
            enum: [
                "Mathematics",
                "Physics",
                "Chemistry",
                "Biology",
                "Computer Science",
                "English",
                "History",
                "Geography",
                "Economics",
                "Other",
            ],
        },
        category: {
            type: String,
            enum: [
                "Exam Preparation",
                "College/School",
                "Skill Learning",
                "Study Group",
                "Project Team",
                "Other",
            ],
            default: "Study Group",
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
        profilePicture: {
            type: String,
            default: "",
        },
        coverImage: {
            type: String,
            default: "",
        },
        rules: {
            type: String,
            maxlength: 1000,
        },
        inviteCode: {
            type: String,
            unique: true,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                role: {
                    type: String,
                    enum: ["admin", "moderator", "member"],
                    default: "member",
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        memberCount: {
            type: Number,
            default: 1,
        },
        tags: [String],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance

groupSchema.index({ subject: 1, category: 1 });
groupSchema.index({ isPrivate: 1, isActive: 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ "members.user": 1 });

// Helper method to check if user is member
groupSchema.methods.isMember = function (userId) {
    return this.members.some((m) => {
        const id = m.user._id || m.user;
        return id.toString() === userId.toString();
    });
};

// Helper method to get user's role
groupSchema.methods.getUserRole = function (userId) {
    const member = this.members.find(
        (m) => m.user.toString() === userId.toString()
    );
    return member ? member.role : null;
};

// Helper method to check if user is admin
groupSchema.methods.isAdmin = function (userId) {
    return this.getUserRole(userId) === "admin";
};

// Helper method to check if user is admin or moderator
groupSchema.methods.canModerate = function (userId) {
    const role = this.getUserRole(userId);
    return role === "admin" || role === "moderator";
};

module.exports = mongoose.model("Group", groupSchema);
