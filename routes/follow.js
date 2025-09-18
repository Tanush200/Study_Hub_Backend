
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


router.post("/follow/:targetUserId", authMiddleware, followUser);
router.post("/unfollow/:targetUserId", authMiddleware, unfollowUser);


router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);


router.get("/status/:targetUserId", authMiddleware, getFollowStatus);

module.exports = router;
