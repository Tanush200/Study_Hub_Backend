const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');

class NotionService {
    constructor(accessToken) {
        this.client = new Client({ auth: accessToken });
        this.n2m = new NotionToMarkdown({ notionClient: this.client });
    }

    /**
     * Get page details from Notion
     */
    async getPage(pageId) {
        try {
            const page = await this.client.pages.retrieve({ page_id: pageId });
            return page;
        } catch (error) {
            console.error('Error fetching Notion page:', error);
            throw new Error(`Failed to fetch page: ${error.message}`);
        }
    }

    /**
     * Get all blocks from a page
     */
    async getPageBlocks(pageId) {
        try {
            const blocks = await this.client.blocks.children.list({
                block_id: pageId,
                page_size: 100
            });
            return blocks.results;
        } catch (error) {
            console.error('Error fetching page blocks:', error);
            throw new Error(`Failed to fetch blocks: ${error.message}`);
        }
    }

    /**
     * Convert Notion blocks to Markdown
     */
    async convertPageToMarkdown(pageId) {
        try {
            const mdblocks = await this.n2m.pageToMarkdown(pageId);
            const mdString = this.n2m.toMarkdownString(mdblocks);
            return mdString.parent || mdString;
        } catch (error) {
            console.error('Error converting to markdown:', error);
            throw new Error(`Failed to convert to markdown: ${error.message}`);
        }
    }

    /**
     * Search for pages in workspace
     */
    async searchPages(query = '', pageSize = 100) {
        try {
            const response = await this.client.search({
                query,
                filter: {
                    property: 'object',
                    value: 'page'
                },
                page_size: pageSize,
                sort: {
                    direction: 'descending',
                    timestamp: 'last_edited_time'
                }
            });
            return response.results;
        } catch (error) {
            console.error('Error searching pages:', error);
            throw new Error(`Failed to search pages: ${error.message}`);
        }
    }

    /**
     * Get databases in workspace
     */
    async searchDatabases(query = '', pageSize = 100) {
        try {
            const response = await this.client.search({
                query,
                filter: {
                    property: 'object',
                    value: 'database'
                },
                page_size: pageSize
            });
            return response.results;
        } catch (error) {
            console.error('Error searching databases:', error);
            throw new Error(`Failed to search databases: ${error.message}`);
        }
    }

    /**
     * Get page title from properties
     */
    getPageTitle(page) {
        try {
            // Try to get title from different property types
            const titleProperty = Object.values(page.properties).find(
                prop => prop.type === 'title'
            );

            if (titleProperty && titleProperty.title && titleProperty.title.length > 0) {
                return titleProperty.title[0].plain_text;
            }

            return 'Untitled';
        } catch (error) {
            return 'Untitled';
        }
    }

    /**
     * Get page metadata (icon, cover, etc.)
     */
    getPageMetadata(page) {
        return {
            icon: page.icon?.emoji || page.icon?.file?.url || null,
            cover: page.cover?.file?.url || page.cover?.external?.url || null,
            archived: page.archived || false,
            url: page.url,
            lastEditedTime: page.last_edited_time,
            createdTime: page.created_time
        };
    }

    /**
     * Test connection by getting user info
     */
    async testConnection() {
        try {
            const response = await this.client.users.me();
            return { success: true, user: response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = NotionService;
