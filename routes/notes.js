const express = require("express");
const Note = require("../models/Note");
const router = express.Router();


router.get("/", async (req, res) => {
    try {
        const notes = await Note.find({
            status:'approved'
        })
        .populate('uploaderId', 'username profile')
        .sort({ createdAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
         console.error("Get notes error:", error);
         res.status(500).json({ message: "Server error" });
    }
})

module.exports = router;