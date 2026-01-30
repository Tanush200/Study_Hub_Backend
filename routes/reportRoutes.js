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

module.exports = router;
