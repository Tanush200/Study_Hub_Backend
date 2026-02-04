const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Default looks in current dir (backend/.env)

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-pro",
    "gemini-1.0-pro"
];

async function testModels() {
    console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Loaded" : "Missing");
    if (!process.env.GEMINI_API_KEY) {
        console.error("Error: GEMINI_API_KEY is missing in .env");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    for (const modelName of modelsToTest) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ SUCCESS`);
            // We found a working model, let's print it clearly
            console.log(`\n>>> RECOMMENDED MODEL: ${modelName} <<<\n`);
            return;
        } catch (e) {
            console.log(`❌ FAILED`);
            console.log(`   Reason: ${e.message}`);
        }
    }
}

testModels();
