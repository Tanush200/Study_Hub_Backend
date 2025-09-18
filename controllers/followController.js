
const User = require("../models/User");


const followUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;


    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = await User.findById(currentUserId);


    if (currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

  
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId },
        $inc: { "stats.followingCount": 1 },
      }),
      User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId },
        $inc: { "stats.followersCount": 1 },
      }),
    ]);

    res.json({
      message: "Successfully followed user",
      isFollowing: true,
      followersCount: targetUser.stats.followersCount + 1,
    });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const unfollowUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = await User.findById(currentUserId);


    if (!currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ message: "Not following this user" });
    }

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId },
        $inc: { "stats.followingCount": -1 },
      }),
      User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
        $inc: { "stats.followersCount": -1 },
      }),
    ]);

    res.json({
      message: "Successfully unfollowed user",
      isFollowing: false,
      followersCount: Math.max(0, targetUser.stats.followersCount - 1),
    });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).populate({
      path: "followers",
      select: "username profile stats.followersCount stats.followingCount",
      options: {
        limit: limit * 1,
        skip: (page - 1) * limit,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      followers: user.followers,
      totalCount: user.stats.followersCount,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).populate({
      path: "following",
      select: "username profile stats.followersCount stats.followingCount",
      options: {
        limit: limit * 1,
        skip: (page - 1) * limit,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      following: user.following,
      totalCount: user.stats.followingCount,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getFollowStatus = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.includes(targetUserId);

    const targetUser = await User.findById(targetUserId);
    const followsBack = targetUser.following.includes(currentUserId);

    res.json({
      isFollowing,
      followsBack,
      isMutual: isFollowing && followsBack,
    });
  } catch (error) {
    console.error("Get follow status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
};
