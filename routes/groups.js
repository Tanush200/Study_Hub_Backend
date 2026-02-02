const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const authMiddleware = require("../middleware/auth");

// Helper function to generate unique invite code
const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name, description, subject, category, isPrivate, rules, tags } =
            req.body;

        if (!name) {
            return res.status(400).json({ message: "Group name is required" });
        }

        // Generate unique invite code
        let inviteCode = generateInviteCode();
        let existingGroup = await Group.findOne({ inviteCode });

        // Ensure invite code is unique
        while (existingGroup) {
            inviteCode = generateInviteCode();
            existingGroup = await Group.findOne({ inviteCode });
        }

        const group = await Group.create({
            name,
            description,
            subject,
            category,
            isPrivate: isPrivate || false,
            rules,
            tags: tags || [],
            inviteCode,
            createdBy: req.user._id,
            members: [
                {
                    user: req.user._id,
                    role: "admin",
                    joinedAt: new Date(),
                },
            ],
            memberCount: 1,
        });

        const populatedGroup = await Group.findById(group._id)
            .populate("createdBy", "username email profile.avatar")
            .populate("members.user", "username email profile.avatar");

        res.status(201).json({
            message: "Group created successfully",
            group: populatedGroup,
        });
    } catch (error) {
        console.error("Create group error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/groups
// @desc    Get all public groups (with filters)
// @access  Public
router.get("/", async (req, res) => {
    try {
        const { search, subject, category, page = 1, limit = 20 } = req.query;

        const query = { isPrivate: false, isActive: true };

        if (search) {
            // Escape special regex characters to prevent crashes
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } },
                { tags: { $in: [new RegExp(safeSearch, "i")] } },
            ];
        }

        if (subject) {
            query.subject = subject;
        }

        if (category) {
            query.category = category;
        }

        const groups = await Group.find(query)
            .populate("createdBy", "username profile.avatar")
            .sort({ memberCount: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Group.countDocuments(query);

        res.json({
            groups,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Get groups error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/groups/my-groups
// @desc    Get user's groups
// @access  Private
router.get("/my-groups", authMiddleware, async (req, res) => {
    try {
        const groups = await Group.find({
            "members.user": req.user._id,
            isActive: true,
        })
            .populate("createdBy", "username profile.avatar")
            .populate("members.user", "username profile.avatar")
            .sort({ updatedAt: -1 });

        res.json({ groups });
    } catch (error) {
        console.error("Get my groups error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/groups/:id
// @desc    Get group by ID
// @access  Public (for public groups) / Private (for private groups)
router.get("/:id", async (req, res) => {
    try {
        // Optional Auth: Manually check for token to populate req.user if present
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            try {
                const jwt = require("jsonwebtoken");
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = { _id: decoded.userId }; // Minimal user object
            } catch (err) {
                // Token invalid/expired - ignore, treat as guest
                console.log("Optional auth token invalid:", err.message);
            }
        }

        const group = await Group.findById(req.params.id)
            .populate("createdBy", "username email profile.avatar")
            .populate("members.user", "username email profile.avatar");

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if group is private
        if (group.isPrivate) {
            // Require authentication for private groups
            if (!req.user) {
                return res
                    .status(401)
                    .json({ message: "Authentication required for private groups" });
            }

            // Check if user is a member
            if (!group.isMember(req.user._id)) {
                // Return sanitized group info for non-members
                // We hide the members list to protect privacy of private group members
                const sanitizedGroup = group.toObject();
                sanitizedGroup.members = []; // Hide members
                // We can keep other public info like name, description, usage stats

                return res.json({ group: sanitizedGroup });
            }
        }

        res.json({ group });
    } catch (error) {
        console.error("Get group error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private (Admin only)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is admin
        if (!group.isAdmin(req.user._id)) {
            return res
                .status(403)
                .json({ message: "Only admins can update group details" });
        }

        const { name, description, subject, category, rules, tags, profilePicture, coverImage } =
            req.body;

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (subject) group.subject = subject;
        if (category) group.category = category;
        if (rules !== undefined) group.rules = rules;
        if (tags) group.tags = tags;
        if (profilePicture !== undefined) group.profilePicture = profilePicture;
        if (coverImage !== undefined) group.coverImage = coverImage;

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("createdBy", "username profile.avatar")
            .populate("members.user", "username profile.avatar");

        res.json({ message: "Group updated successfully", group: updatedGroup });
    } catch (error) {
        console.error("Update group error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   DELETE /api/groups/:id
// @desc    Delete group
// @access  Private (Admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is admin
        if (!group.isAdmin(req.user._id)) {
            return res
                .status(403)
                .json({ message: "Only admins can delete the group" });
        }

        // Soft delete
        group.isActive = false;
        await group.save();

        res.json({ message: "Group deleted successfully" });
    } catch (error) {
        console.error("Delete group error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/groups/:id/join
// @desc    Join a group
// @access  Private
router.post("/:id/join", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if already a member
        if (group.isMember(req.user._id)) {
            return res
                .status(400)
                .json({ message: "You are already a member of this group" });
        }

        // Check if group is private
        if (group.isPrivate) {
            const { inviteCode } = req.body;

            if (!inviteCode || inviteCode !== group.inviteCode) {
                return res.status(403).json({ message: "Invalid invite code" });
            }
        }

        // Add user to members
        group.members.push({
            user: req.user._id,
            role: "member",
            joinedAt: new Date(),
        });
        group.memberCount += 1;

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("createdBy", "username profile.avatar")
            .populate("members.user", "username profile.avatar");

        res.json({ message: "Joined group successfully", group: updatedGroup });
    } catch (error) {
        console.error("Join group error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post("/:id/leave", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member
        if (!group.isMember(req.user._id)) {
            return res
                .status(400)
                .json({ message: "You are not a member of this group" });
        }

        // Prevent last admin from leaving
        const admins = group.members.filter((m) => m.role === "admin");
        if (admins.length === 1 && group.isAdmin(req.user._id)) {
            return res.status(400).json({
                message:
                    "You are the only admin. Please promote another member before leaving",
            });
        }

        // Remove user from members
        group.members = group.members.filter(
            (m) => m.user.toString() !== req.user._id.toString()
        );
        group.memberCount -= 1;

        await group.save();

        res.json({ message: "Left group successfully" });
    } catch (error) {
        console.error("Leave group error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   PUT /api/groups/:id/members/:userId/role
// @desc    Update member role
// @access  Private (Admin only)
router.put("/:id/members/:userId/role", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is admin
        if (!group.isAdmin(req.user._id)) {
            return res
                .status(403)
                .json({ message: "Only admins can change member roles" });
        }

        const { role } = req.body;

        if (!["admin", "moderator", "member"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const member = group.members.find(
            (m) => m.user.toString() === req.params.userId
        );

        if (!member) {
            return res.status(404).json({ message: "Member not found in group" });
        }

        member.role = role;
        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("createdBy", "username profile.avatar")
            .populate("members.user", "username profile.avatar");

        res.json({ message: "Member role updated successfully", group: updatedGroup });
    } catch (error) {
        console.error("Update member role error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remove member from group
// @access  Private (Admin/Moderator)
router.delete("/:id/members/:userId", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user can moderate
        if (!group.canModerate(req.user._id)) {
            return res
                .status(403)
                .json({ message: "Only admins and moderators can remove members" });
        }

        const targetMember = group.members.find(
            (m) => m.user.toString() === req.params.userId
        );

        if (!targetMember) {
            return res.status(404).json({ message: "Member not found in group" });
        }

        // Moderators cannot remove admins
        if (
            targetMember.role === "admin" &&
            group.getUserRole(req.user._id) === "moderator"
        ) {
            return res
                .status(403)
                .json({ message: "Moderators cannot remove admins" });
        }

        // Remove member
        group.members = group.members.filter(
            (m) => m.user.toString() !== req.params.userId
        );
        group.memberCount -= 1;

        await group.save();

        res.json({ message: "Member removed successfully" });
    } catch (error) {
        console.error("Remove member error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/groups/:id/regenerate-invite
// @desc    Regenerate invite code
// @access  Private (Admin only)
router.get("/:id/regenerate-invite", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is admin
        if (!group.isAdmin(req.user._id)) {
            return res
                .status(403)
                .json({ message: "Only admins can regenerate invite code" });
        }

        // Generate new unique invite code
        let newInviteCode = generateInviteCode();
        let existingGroup = await Group.findOne({ inviteCode: newInviteCode });

        while (existingGroup) {
            newInviteCode = generateInviteCode();
            existingGroup = await Group.findOne({ inviteCode: newInviteCode });
        }

        group.inviteCode = newInviteCode;
        await group.save();

        res.json({
            message: "Invite code regenerated successfully",
            inviteCode: newInviteCode,
        });
    } catch (error) {
        console.error("Regenerate invite code error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/groups/join-by-code
// @desc    Join a group using invite code
// @access  Private
router.post("/join-by-code", authMiddleware, async (req, res) => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ message: "Invite code is required" });
        }

        const group = await Group.findOne({ inviteCode });

        if (!group) {
            return res.status(404).json({ message: "Invalid invite code. Group not found." });
        }

        // Check if already a member
        if (group.isMember(req.user._id)) {
            // Even if already member, return success so frontend redirects
            return res.json({
                message: "You are already a member of this group",
                group
            });
        }

        // Add user to members
        group.members.push({
            user: req.user._id,
            role: "member",
            joinedAt: new Date(),
        });
        group.memberCount += 1;

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("createdBy", "username profile.avatar")
            .populate("members.user", "username profile.avatar");

        res.json({ message: "Joined group successfully", group: updatedGroup });
    } catch (error) {
        console.error("Join group by code error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
