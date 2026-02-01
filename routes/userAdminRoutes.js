const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/admin/users/:id/block
// @desc    Block a user for 7 days
// @access  Private/Admin
router.post('/:id/block', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { reason } = req.body;
        const userToBlock = await User.findById(req.params.id);

        if (!userToBlock) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToBlock.role === 'admin') {
            return res.status(400).json({ message: 'Cannot block admin users' });
        }

        // Block user for 7 days
        const blockDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        userToBlock.isBlocked = true;
        userToBlock.blockReason = reason || 'Blocked by admin';
        userToBlock.blockedAt = new Date();
        userToBlock.blockedBy = req.user._id;
        userToBlock.blockExpiresAt = new Date(Date.now() + blockDuration);

        await userToBlock.save();

        res.json({
            message: `User ${userToBlock.username} blocked for 7 days`,
            blockedUntil: userToBlock.blockExpiresAt
        });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ message: 'Server error while blocking user' });
    }
});

// @route   POST /api/admin/users/:id/unblock
// @desc    Unblock a user
// @access  Private/Admin
router.post('/:id/unblock', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const userToUnblock = await User.findById(req.params.id);

        if (!userToUnblock) {
            return res.status(404).json({ message: 'User not found' });
        }

        userToUnblock.isBlocked = false;
        userToUnblock.blockReason = null;
        userToUnblock.blockedAt = null;
        userToUnblock.blockedBy = null;
        userToUnblock.blockExpiresAt = null;

        await userToUnblock.save();

        res.json({ message: `User ${userToUnblock.username} unblocked successfully` });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ message: 'Server error while unblocking user' });
    }
});

// @route   GET /api/admin/users/blocked
// @desc    Get list of blocked users
// @access  Private/Admin
router.get('/blocked', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const blockedUsers = await User.find({ isBlocked: true })
            .select('username email isBlocked blockReason blockedAt blockExpiresAt')
            .populate('blockedBy', 'username email')
            .sort({ blockedAt: -1 });

        res.json(blockedUsers);
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        res.status(500).json({ message: 'Server error while fetching blocked users' });
    }
});

// @route   PATCH /api/admin/users/:id/block-duration
// @desc    Extend or reduce block duration
// @access  Private/Admin
router.patch('/:id/block-duration', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { days } = req.body; // Number of days to extend/reduce
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isBlocked) {
            return res.status(400).json({ message: 'User is not blocked' });
        }

        const newExpiry = new Date(user.blockExpiresAt.getTime() + (days * 24 * 60 * 60 * 1000));
        user.blockExpiresAt = newExpiry;

        await user.save();

        res.json({
            message: `Block duration updated for ${user.username}`,
            newExpiryDate: newExpiry
        });
    } catch (error) {
        console.error('Error updating block duration:', error);
        res.status(500).json({ message: 'Server error while updating block duration' });
    }
});

module.exports = router;
