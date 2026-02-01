const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      // Check if block has expired
      if (user.blockExpiresAt && new Date() > user.blockExpiresAt) {
        // Auto-unblock expired blocks
        user.isBlocked = false;
        user.blockReason = null;
        user.blockedAt = null;
        user.blockedBy = null;
        user.blockExpiresAt = null;
        await user.save();
      } else {
        // Block is still active
        const expiryDate = user.blockExpiresAt ? new Date(user.blockExpiresAt).toLocaleDateString() : 'indefinitely';
        return res.status(403).json({
          message: "Your account has been blocked",
          reason: user.blockReason || "Violation of terms of service",
          blockedUntil: expiryDate
        });
      }
    }

    console.log("🔍 User authenticated:", user.username, "Role:", user.role);
    req.user = user;
    next();

  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
