const axios = require('axios');
require("dotenv").config();

async function checkKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API Key found");
        return;
    }

    console.log(`Checking key: ${key.substring(0, 10)}...`);

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await axios.get(url);

        console.log("✅ API Key is Valid!");
        console.log("Available Models:");

        const models = response.data.models;
        if (models && models.length > 0) {
            models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.log("No models returned (Active but empty?)");
        }

    } catch (error) {
        console.error("❌ API Request Failed");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

checkKey();
