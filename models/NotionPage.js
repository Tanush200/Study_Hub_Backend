const mongoose = require('mongoose');

const NotionPageSchema = new mongoose.Schema({
    notionPageId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    connectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NotionConnection',
        required: true
    },
    noteVaultNoteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
    },
    title: {
        type: String,
        default: 'Untitled'
    },
    notionUrl: String,
    lastSyncedAt: Date,
    lastEditedTime: Date, // From Notion API
    syncDirection: {
        type: String,
        enum: ['notion-to-vault', 'vault-to-notion', 'bidirectional'],
        default: 'notion-to-vault'
    },
    metadata: {
        icon: String,
        cover: String,
        archived: {
            type: Boolean,
            default: false
        },
        parentType: String, // 'page', 'database', 'workspace'
        parentId: String
    },
    importStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    errorMessage: String
}, {
    timestamps: true
});

// Compound indexes for efficient queries
NotionPageSchema.index({ userId: 1, connectionId: 1 });
NotionPageSchema.index({ noteVaultNoteId: 1 });

module.exports = mongoose.model('NotionPage', NotionPageSchema);
