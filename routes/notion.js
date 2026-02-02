const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notionController = require('../controllers/notionController');

// OAuth routes
router.get('/auth', auth, notionController.initiateOAuth);
router.get('/auth/callback', notionController.handleOAuthCallback);

// Connection management
router.get('/connections', auth, notionController.getConnections);
router.delete('/connections/:connectionId', auth, notionController.disconnectWorkspace);

// Workspace browsing
router.get('/workspace/pages', auth, notionController.listWorkspacePages);

// Import operations
router.post('/import/pages', auth, notionController.importPages);
router.get('/imported-pages', auth, notionController.getImportedPages);

module.exports = router;
