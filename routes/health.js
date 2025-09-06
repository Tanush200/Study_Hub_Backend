const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// @route   GET /api/health
// @desc    Health check
router.get("/", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

  res.status(200).json({
    message: "Server is running",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
