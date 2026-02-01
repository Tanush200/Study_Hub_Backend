const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/reports
// @desc    Submit a new report
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { reportedUserId, reportedContent, reason, context, roomId, additionalComments } = req.body;

        const newReport = new Report({
            reporterId: req.user._id,
            reportedUserId,
            reportedContent,
            reason,
            context,
            roomId,
            additionalComments
        });

        await newReport.save();

        res.status(201).json({ message: 'Report submitted successfully', report: newReport });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ message: 'Server error while submitting report' });
    }
});

// @route   GET /api/reports
// @desc    Get all reports (Admin only)
// @access  Private/Admin
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const reports = await Report.find()
            .populate('reporterId', 'username email')
            .populate('reportedUserId', 'username email')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server error while fetching reports' });
    }
});

// @route   PATCH /api/reports/:id/status
// @desc    Update report status and add admin notes
// @access  Private/Admin
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { status, actionTaken, adminNotes } = req.body;

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.status = status || report.status;
        report.actionTaken = actionTaken || report.actionTaken;
        report.adminNotes = adminNotes || report.adminNotes;
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();

        await report.save();

        const updatedReport = await Report.findById(req.params.id)
            .populate('reporterId', 'username email')
            .populate('reportedUserId', 'username email')
            .populate('reviewedBy', 'username email');

        res.json({ message: 'Report updated successfully', report: updatedReport });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Server error while updating report' });
    }
});

// @route   POST /api/reports/:id/block-user
// @desc    Block the reported user for 7 days
// @access  Private/Admin
router.post('/:id/block-user', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const User = require('../models/User');
        const report = await Report.findById(req.params.id).populate('reportedUserId');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (!report.reportedUserId) {
            return res.status(400).json({ message: 'No user to block in this report' });
        }

        const userToBlock = await User.findById(report.reportedUserId._id);
        if (!userToBlock) {
            return res.status(404).json({ message: 'Reported user not found' });
        }

        // Block user for 7 days
        const blockDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        userToBlock.isBlocked = true;
        userToBlock.blockReason = report.reason + (report.adminNotes ? `: ${report.adminNotes}` : '');
        userToBlock.blockedAt = new Date();
        userToBlock.blockedBy = req.user._id;
        userToBlock.blockExpiresAt = new Date(Date.now() + blockDuration);

        await userToBlock.save();

        // Update report
        report.status = 'Resolved';
        report.actionTaken = 'User Blocked';
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();
        await report.save();

        res.json({
            message: `User ${userToBlock.username} blocked for 7 days`,
            blockedUntil: userToBlock.blockExpiresAt
        });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ message: 'Server error while blocking user' });
    }
});

// @route   GET /api/reports/stats
// @desc    Get report statistics
// @access  Private/Admin
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const totalReports = await Report.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'Pending' });
        const resolvedReports = await Report.countDocuments({ status: 'Resolved' });
        const dismissedReports = await Report.countDocuments({ status: 'Dismissed' });

        const reportsByContext = await Report.aggregate([
            { $group: { _id: '$context', count: { $sum: 1 } } }
        ]);

        const reportsByReason = await Report.aggregate([
            { $group: { _id: '$reason', count: { $sum: 1 } } }
        ]);

        res.json({
            total: totalReports,
            pending: pendingReports,
            resolved: resolvedReports,
            dismissed: dismissedReports,
            byContext: reportsByContext,
            byReason: reportsByReason
        });
    } catch (error) {
        console.error('Error fetching report stats:', error);
        res.status(500).json({ message: 'Server error while fetching stats' });
    }
});

module.exports = router;
