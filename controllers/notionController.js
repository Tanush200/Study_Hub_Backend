const axios = require('axios');
const NotionConnection = require('../models/NotionConnection');
const NotionPage = require('../models/NotionPage');
const Note = require('../models/Note');
const NotionService = require('../services/notionService');

/**
 * Initiate Notion OAuth flow
 */
exports.initiateOAuth = (req, res) => {
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return res.status(500).json({
            error: 'Notion integration not configured. Please add NOTION_CLIENT_ID and NOTION_REDIRECT_URI to .env'
        });
    }

    // Pass user ID in state parameter (base64 encoded for security)
    const userId = req.user.id || req.user._id;
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    res.json({ authUrl });
};

/**
 * Handle OAuth callback from Notion
 */
exports.handleOAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code not provided' });
        }

        if (!state) {
            return res.redirect(`${process.env.FRONTEND_URL}/notion-settings?error=invalid_state`);
        }

        // Decode state to get user ID
        let userId;
        try {
            const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
            userId = decodedState.userId;
        } catch (error) {
            console.error('Failed to decode state:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/notion-settings?error=invalid_state`);
        }

        if (!userId) {
            return res.redirect(`${process.env.FRONTEND_URL}/notion-settings?error=user_not_found`);
        }

        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://api.notion.com/v1/oauth/token',
            {
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.NOTION_REDIRECT_URI
            },
            {
                auth: {
                    username: process.env.NOTION_CLIENT_ID,
                    password: process.env.NOTION_CLIENT_SECRET
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const { access_token, workspace_id, workspace_name, bot_id, owner } = tokenResponse.data;

        // Extract workspace name - Notion returns it in different formats
        let workspaceName = 'My Notion Workspace';

        if (workspace_name) {
            workspaceName = workspace_name;
        } else if (owner && owner.workspace) {
            // Sometimes it's in owner.workspace
            if (typeof owner.workspace === 'string') {
                workspaceName = owner.workspace;
            } else if (owner.workspace.name) {
                workspaceName = owner.workspace.name;
            }
        }

        console.log('📝 Workspace details:', { workspace_id, workspaceName, bot_id });

        // Check if connection already exists
        let connection = await NotionConnection.findOne({
            userId,
            notionWorkspaceId: workspace_id
        });

        if (connection) {
            // Update existing connection
            connection.accessToken = access_token;
            connection.notionWorkspaceName = workspaceName;
            connection.botId = bot_id;
            connection.status = 'active';
            connection.connectedAt = new Date();
            await connection.save();
        } else {
            // Create new connection
            connection = await NotionConnection.create({
                userId,
                notionWorkspaceId: workspace_id,
                notionWorkspaceName: workspaceName,
                accessToken: access_token,
                botId: bot_id,
                status: 'active'
            });
        }

        console.log('✅ Notion workspace connected:', workspaceName);

        // Redirect to frontend with success
        res.redirect(`${process.env.FRONTEND_URL}/notion-settings?success=true`);
    } catch (error) {
        console.error('OAuth callback error:', error.response?.data || error.message);
        res.redirect(`${process.env.FRONTEND_URL}/notion-settings?error=connection_failed`);
    }
};

/**
 * Get user's Notion connections
 */
exports.getConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        const connections = await NotionConnection.find({
            userId,
            status: { $ne: 'disconnected' }
        }).sort({ connectedAt: -1 });

        res.json({ connections });
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
};

/**
 * Disconnect Notion workspace
 */
exports.disconnectWorkspace = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.user.id;

        const connection = await NotionConnection.findOne({
            _id: connectionId,
            userId
        });

        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        connection.status = 'disconnected';
        connection.syncEnabled = false;
        await connection.save();

        res.json({ message: 'Workspace disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting workspace:', error);
        res.status(500).json({ error: 'Failed to disconnect workspace' });
    }
};

/**
 * List pages in workspace
 */
exports.listWorkspacePages = async (req, res) => {
    try {
        const { connectionId } = req.query;
        const userId = req.user.id;

        const connection = await NotionConnection.findOne({
            _id: connectionId,
            userId,
            status: 'active'
        });

        if (!connection) {
            return res.status(404).json({ error: 'Connection not found or inactive' });
        }

        const notionService = new NotionService(connection.accessToken);
        const pages = await notionService.searchPages();

        // Format pages for frontend
        const formattedPages = pages.map(page => ({
            id: page.id,
            title: notionService.getPageTitle(page),
            url: page.url,
            icon: page.icon?.emoji || page.icon?.file?.url || null,
            lastEditedTime: page.last_edited_time,
            archived: page.archived
        }));

        res.json({ pages: formattedPages });
    } catch (error) {
        console.error('Error listing pages:', error);
        res.status(500).json({ error: 'Failed to fetch pages from Notion' });
    }
};

/**
 * Import pages from Notion
 */
exports.importPages = async (req, res) => {
    try {
        const { connectionId, pageIds } = req.body;
        const userId = req.user.id;

        if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
            return res.status(400).json({ error: 'Page IDs are required' });
        }

        const connection = await NotionConnection.findOne({
            _id: connectionId,
            userId,
            status: 'active'
        });

        if (!connection) {
            return res.status(404).json({ error: 'Connection not found or inactive' });
        }

        const notionService = new NotionService(connection.accessToken);
        const importedPages = [];
        const errors = [];

        // Import each page
        for (const pageId of pageIds) {
            try {
                // Check if already imported
                const existingPage = await NotionPage.findOne({ notionPageId: pageId });
                if (existingPage) {
                    errors.push({ pageId, error: 'Page already imported' });
                    continue;
                }

                // Fetch page from Notion
                const page = await notionService.getPage(pageId);
                const title = notionService.getPageTitle(page);
                const metadata = notionService.getPageMetadata(page);

                // Convert to markdown
                const content = await notionService.convertPageToMarkdown(pageId);

                // Create a data URL for the markdown content (so it can be viewed)
                const markdownDataUrl = `data:text/markdown;base64,${Buffer.from(content).toString('base64')}`;

                // Create note in NoteVault
                const note = await Note.create({
                    uploaderId: userId,
                    title,
                    description: `Imported from Notion: ${title}`,
                    category: {
                        subject: 'General',
                        examType: 'semester'
                    },
                    file: {
                        originalName: `${title}.md`,
                        fileType: 'text/markdown',
                        fileUrl: markdownDataUrl, // Store markdown as data URL
                        fileSize: Buffer.byteLength(content, 'utf8')
                    },
                    metadata: {
                        tags: ['notion-import']
                    },
                    status: 'pending', // Require admin approval for Notion imports
                    processingStatus: 'completed'
                });

                // Track the mapping
                const notionPage = await NotionPage.create({
                    notionPageId: pageId,
                    userId,
                    connectionId: connection._id,
                    noteVaultNoteId: note._id,
                    title,
                    notionUrl: metadata.url,
                    lastSyncedAt: new Date(),
                    lastEditedTime: metadata.lastEditedTime,
                    metadata: {
                        icon: metadata.icon,
                        cover: metadata.cover,
                        archived: metadata.archived
                    },
                    importStatus: 'completed'
                });

                // Update connection stats
                connection.stats.pagesImported = (connection.stats.pagesImported || 0) + 1;
                connection.stats.lastImportAt = new Date();
                connection.lastSyncAt = new Date();
                await connection.save();

                importedPages.push({
                    pageId,
                    noteId: note._id,
                    title
                });
            } catch (error) {
                console.error(`Error importing page ${pageId}:`, error);
                errors.push({ pageId, error: error.message });
            }
        }

        res.json({
            message: 'Import completed',
            imported: importedPages,
            errors: errors.length > 0 ? errors : undefined,
            stats: {
                total: pageIds.length,
                successful: importedPages.length,
                failed: errors.length
            }
        });
    } catch (error) {
        console.error('Error importing pages:', error);
        res.status(500).json({ error: 'Failed to import pages' });
    }
};

/**
 * Get imported pages for a connection
 */
exports.getImportedPages = async (req, res) => {
    try {
        const { connectionId } = req.query;
        const userId = req.user.id;

        const query = { userId };
        if (connectionId) {
            query.connectionId = connectionId;
        }

        const importedPages = await NotionPage.find(query)
            .populate('noteVaultNoteId', 'title subject createdAt')
            .sort({ lastSyncedAt: -1 });

        res.json({ pages: importedPages });
    } catch (error) {
        console.error('Error fetching imported pages:', error);
        res.status(500).json({ error: 'Failed to fetch imported pages' });
    }
};
