const mongoose = require('mongoose');

const NotionConnectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    notionWorkspaceId: {
        type: String,
        required: true
    },
    notionWorkspaceName: {
        type: String,
        default: 'My Notion Workspace'
    },
    accessToken: {
        type: String,
        required: true
        // TODO: Encrypt this in production
    },
    botId: String,
    connectedAt: {
        type: Date,
        default: Date.now
    },
    lastSyncAt: Date,
    syncEnabled: {
        type: Boolean,
        default: true
    },
    syncSettings: {
        autoSync: {
            type: Boolean,
            default: false
        },
        syncInterval: {
            type: Number,
            default: 60 // minutes
        }
    },
    status: {
        type: String,
        enum: ['active', 'disconnected', 'error'],
        default: 'active'
    },
    errorMessage: String,
    stats: {
        pagesImported: {
            type: Number,
            default: 0
        },
        lastImportAt: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
NotionConnectionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('NotionConnection', NotionConnectionSchema);
