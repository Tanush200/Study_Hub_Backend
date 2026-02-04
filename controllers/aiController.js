const aiService = require('../services/aiService');
const Note = require('../models/Note');
const axios = require('axios');

// Helper to get content from request
// Returns { content: string, mimeType: string }
const getContentData = async (req) => {
    const { content, noteId } = req.body;

    // 1. Direct Text Content
    if (content) return { content, mimeType: 'text/plain' };

    // 2. From Note ID
    if (noteId) {
        const note = await Note.findById(noteId);
        if (!note) throw new Error("Note not found");

        // A. If note has text content (transcription or direct)
        if (note.content || note.transcription) {
            return {
                content: note.content || note.transcription,
                mimeType: 'text/plain'
            };
        }

        // B. If note is a file (PDF/Image) stored in S3/Cloudinary
        if (note.file && note.file.fileUrl) {
            try {
                // Fetch the file as a buffer
                const response = await axios.get(note.file.fileUrl, {
                    responseType: 'arraybuffer'
                });

                // Convert to base64
                const base64Data = Buffer.from(response.data, 'binary').toString('base64');

                // Determine mimeType (default to PDF if unknown, or infer from extension/header)
                let mimeType = 'application/pdf'; // Default Assumption for docs
                const contentType = response.headers['content-type'];
                if (contentType) mimeType = contentType;

                return { content: base64Data, mimeType };
            } catch (err) {
                console.error("Error fetching file for AI:", err);
                throw new Error("Failed to download note file for analysis");
            }
        }
    }

    throw new Error("No content available to analyze");
};

exports.createSummary = async (req, res) => {
    try {
        const { content, mimeType } = await getContentData(req);
        const summary = await aiService.generateSummary(content, mimeType);
        res.json({ summary });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createFlashcards = async (req, res) => {
    try {
        const { content, mimeType } = await getContentData(req);
        const flashcards = await aiService.generateFlashcards(content, mimeType);
        res.json({ flashcards });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createQuiz = async (req, res) => {
    try {
        const { content, mimeType } = await getContentData(req);
        const quiz = await aiService.generateQuiz(content, mimeType);
        res.json({ quiz });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
