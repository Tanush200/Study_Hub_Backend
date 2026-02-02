const express = require("express");
const router = express.Router();
const GroupPost = require("../models/GroupPost");
const Group = require("../models/Group");
const auth = require("../middleware/auth");

// @route   POST /api/group-posts
// @desc    Create a new post in a group
// @access  Private
router.post("/", auth, async (req, res) => {
    try {
        const { groupId, content, attachments } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member
        if (!group.isMember(req.user.id)) {
            return res.status(403).json({ message: "You must be a member to post" });
        }

        const post = await GroupPost.create({
            group: groupId,
            author: req.user.id,
            content,
            attachments: attachments || [],
        });

        const populatedPost = await GroupPost.findById(post._id)
            .populate("author", "username profile")
            .populate("comments.author", "username profile");

        res.status(201).json(populatedPost);
    } catch (error) {
        console.error("Create post error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/group-posts/:groupId
// @desc    Get all posts for a group
// @access  Private
router.get("/:groupId", auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is a member (if private)
        if (group.isPrivate && !group.isMember(req.user.id)) {
            return res.status(403).json({ message: "You must be a member to view posts" });
        }

        const posts = await GroupPost.find({
            group: req.params.groupId,
            isDeleted: false,
        })
            .populate("author", "username profile")
            .populate("comments.author", "username profile")
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        console.error("Get posts error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/group-posts/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.post("/:id/like", auth, async (req, res) => {
    try {
        const post = await GroupPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const index = post.likes.indexOf(req.user.id);
        if (index === -1) {
            post.likes.push(req.user.id);
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();
        res.json(post.likes);
    } catch (error) {
        console.error("Like post error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/group-posts/:id/comment
// @desc    Add a comment to a post
// @access  Private
router.post("/:id/comment", auth, async (req, res) => {
    try {
        const { content } = req.body;
        const post = await GroupPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const newComment = {
            author: req.user.id,
            content,
        };

        post.comments.push(newComment);
        await post.save();

        const updatedPost = await GroupPost.findById(req.params.id)
            .populate("author", "username profile")
            .populate("comments.author", "username profile");

        res.json(updatedPost.comments);
    } catch (error) {
        console.error("Comment error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
