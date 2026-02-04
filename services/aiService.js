const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("AI Service Initialized. Key present:", !!process.env.GEMINI_API_KEY);

const MODEL_NAME = 'gemini-2.5-flash'; // Switched to 2.5 Flash per user request to avoid rate limits

/**
 * Helper to construct the model input
 */
const getModelInput = (content, mimeType = 'text/plain') => {
    if (mimeType === 'text/plain' || !mimeType) {
        return [content];
    }

    // For PDFs and Images, content should be base64 string
    return [
        {
            inlineData: {
                data: content,
                mimeType: mimeType
            }
        }
    ];
};

/**
 * Generates a summary
 * @param {string} content - Text or Base64 string
 * @param {string} mimeType - e.g. 'text/plain', 'application/pdf', 'image/jpeg'
 */
exports.generateSummary = async (content, mimeType = 'text/plain') => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const input = getModelInput(content, mimeType);

        const prompt = `
        You are an expert study assistant. 
        Please generate a **strictly structured** summary of the provided material using the following markdown format:

        # Title of the Topic
        
        ## 📌 Key Concepts
        - **Concept 1**: Brief explanation.
        - **Concept 2**: Brief explanation.
        
        ## 📝 Detailed Summary
        Provide a comprehensive paragraph explaining the core ideas, connecting the concepts mentioned above.
        
        ## 🚀 Actionable Takeaways / Exam Tips
        - Tip 1
        - Tip 2

        Keep it concise, easy to read, and formatted exactly as requested.
        `;

        const result = await model.generateContent([prompt, ...input]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Summary Error:", error);
        throw new Error("Failed to generate summary");
    }
};

/**
 * Generates flashcards
 */
exports.generateFlashcards = async (content, mimeType = 'text/plain') => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });
        const input = getModelInput(content, mimeType);

        const prompt = `
        You are an expert study assistant.
        Create a set of 5-10 flashcards based on the provided material.
        Return ONLY a raw JSON array of objects.
        Each object must have 'front' (question/concept) and 'back' (answer/definition) properties.
        `;

        const result = await model.generateContent([prompt, ...input]);
        const response = await result.response;
        // Clean up potential markdown formatting from older models
        const text = response.text().replace(/^```json/, '').replace(/```$/, '');
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Flashcard Error:", error);
        throw new Error("Failed to generate flashcards");
    }
};

/**
 * Generates quiz
 */
exports.generateQuiz = async (content, mimeType = 'text/plain') => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });
        const input = getModelInput(content, mimeType);

        const prompt = `
        You are an expert study assistant.
        Create a 10-question multiple choice quiz based on the provided material.
        Return ONLY a raw JSON array of objects.
        Each object must have:
        - 'question' (string)
        - 'options' (array of 4 strings)
        - 'correctIndex' (number, 0-3)
        `;

        const result = await model.generateContent([prompt, ...input]);
        const response = await result.response;
        const text = response.text().replace(/^```json/, '').replace(/```$/, '');
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Quiz Error:", error);
        throw new Error("Failed to generate quiz");
    }
};
