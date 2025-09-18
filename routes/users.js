
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");


router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🔍 Received userId:", userId); 


    if (!userId || userId === "undefined") {
      return res.status(400).json({ message: "User ID is required" });
    }


    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const user = await User.findById(userId)
      .select("-password -tokens")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
