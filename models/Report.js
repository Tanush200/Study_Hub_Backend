const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reportedContent: {
        type: String
    },
    reason: {
        type: String,
        enum: ['Harassment', 'Spam', 'Inappropriate Content', 'Other'],
        required: true
    },
    context: {
        type: String,
        enum: ['Chat', 'Voice', 'Notes'],
        required: true
    },
    roomId: {
        type: String
    },
    additionalComments: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved', 'Dismissed'],
        default: 'Pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    actionTaken: {
        type: String,
        enum: ['No Action', 'Warning Sent', 'User Blocked', 'Content Removed'],
        default: 'No Action'
    },
    adminNotes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema);
