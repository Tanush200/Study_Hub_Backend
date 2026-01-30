const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid");
const auth = require("../middleware/auth");
const User = require("../models/User");

const bcrypt = require("bcryptjs");

// @route   POST /api/rooms
// @desc    Create a new study room
// @access  Private
router.post("/", auth, async (req, res) => {
    try {
        const { name, topic, password } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ message: "Room name is required" });
        }

        // Check user tier and room count
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const roomCount = await Room.countDocuments({ createdBy: userId });

        if (!user.canCreateRoom(roomCount)) {
            let message = "You have reached your room creation limit.";
            if (user.subscription.tier === 'free') {
                message = "Free tier users cannot create rooms. Please upgrade to Pro or Premium.";
            } else if (user.subscription.tier === 'pro') {
                message = "Pro tier users can only create 20 rooms lifetime. Please upgrade to Premium for unlimited rooms.";
            }
            return res.status(403).json({ message });
        }

        // Generate a unique roomId (short enough to be shareable, or use uuid)
        const roomId = uuidv4().slice(0, 8);

        let hashedPassword = null;
        let isPrivate = false;

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
            isPrivate = true;
        }

        const newRoom = await Room.create({
            roomId,
            name,
            topic: topic || "General Study",
            createdBy: userId,
            isPrivate,
            password: hashedPassword,
        });

        res.status(201).json(newRoom);
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/rooms/:roomId/join
// @desc    Verify password to join a room
// @access  Public
router.post("/:roomId/join", async (req, res) => {
    try {
        const { password } = req.body;
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (!room.isPrivate) {
            return res.status(200).json({ message: "Access granted", roomId: room.roomId });
        }

        if (!password) {
            return res.status(401).json({ message: "Password required" });
        }

        const isMatch = await bcrypt.compare(password, room.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        res.status(200).json({ message: "Access granted", roomId: room.roomId });
    } catch (error) {
        console.error("Error joining room:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/rooms
// @desc    Get all active study rooms
// @access  Public
router.get("/", async (req, res) => {
    try {
        const rooms = await Room.find()
            .select("-password") // Exclude password from list
            .sort({ activeUsers: -1, createdAt: -1 });
        res.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/rooms/:roomId
// @desc    Get room details by ID
// @access  Public
router.get("/:roomId", async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId }).select("-password");
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.json(room);
    } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   DELETE /api/rooms/:roomId
// @desc    Delete a room (Creator or Admin only)
// @access  Private
router.delete("/:roomId", auth, async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Check if user is creator or admin
        // Note: req.user.id is from auth middleware
        // room.createdBy is an ObjectId, so we convert to string for comparison
        const isCreator = room.createdBy && room.createdBy.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to delete this room" });
        }

        await Room.deleteOne({ roomId: req.params.roomId });
        res.json({ message: "Room removed" });
    } catch (error) {
        console.error("Error deleting room:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
