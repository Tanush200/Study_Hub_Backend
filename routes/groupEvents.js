const express = require("express");
const router = express.Router();
const GroupEvent = require("../models/GroupEvent");
const Group = require("../models/Group");
const auth = require("../middleware/auth");

// @route   POST /api/group-events
// @desc    Create a new event
// @access  Private
router.post("/", auth, async (req, res) => {
    try {
        const { groupId, title, description, startDate, endDate, location } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is admin/moderator (optional depending on rules, for now allow members)
        // You might want to restrict this to admins/mods
        // if (!group.canModerate(req.user.id)) ...

        const event = await GroupEvent.create({
            group: groupId,
            organizer: req.user.id,
            title,
            description,
            startDate,
            endDate,
            location,
            attendees: [req.user.id], // Organizer attends by default
        });

        const populatedEvent = await GroupEvent.findById(event._id)
            .populate("organizer", "username profile");

        res.status(201).json(populatedEvent);
    } catch (error) {
        console.error("Create event error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   GET /api/group-events/:groupId
// @desc    Get all events for a group
// @access  Private
router.get("/:groupId", auth, async (req, res) => {
    try {
        const events = await GroupEvent.find({
            group: req.params.groupId,
            endDate: { $gte: new Date() }, // Only future/current events by default
            isCancelled: false,
        })
            .populate("organizer", "username profile")
            .populate("attendees", "username profile")
            .sort({ startDate: 1 });

        res.json(events);
    } catch (error) {
        console.error("Get events error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/group-events/:id/attend
// @desc    Toggle attendance
// @access  Private
router.post("/:id/attend", auth, async (req, res) => {
    try {
        const event = await GroupEvent.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        const index = event.attendees.indexOf(req.user.id);
        if (index === -1) {
            event.attendees.push(req.user.id);
        } else {
            event.attendees.splice(index, 1);
        }

        await event.save();

        // Return full list or just count/status? Return updated event for simplicity
        const updatedEvent = await GroupEvent.findById(event._id)
            .populate("organizer", "username profile")
            .populate("attendees", "username profile");

        res.json(updatedEvent);
    } catch (error) {
        console.error("Attend event error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
