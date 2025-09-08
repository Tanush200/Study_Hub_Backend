// routes/follow.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} = require("../controllers/followController");

// Follow/Unfollow routes
router.post("/follow/:targetUserId", authMiddleware, followUser);
router.post("/unfollow/:targetUserId", authMiddleware, unfollowUser);

// Get followers and following lists
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);

// Check follow status
router.get("/status/:targetUserId", authMiddleware, getFollowStatus);

module.exports = router;
