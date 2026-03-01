const { GoogleGenAI } = require('@google/genai'); // Note the name change
const dotenv = require('dotenv');
dotenv.config();

// The new client picks up GEMINI_API_KEY from process.env automatically, 
// or you can pass it explicitly:
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getRecommendations = async (userLocation, userDestination, availablePosts) => {
  try {
    // Use a 2026-current model string
    const model = 'gemini-2.5-flash'; 

    const prompt = `[Your Prompt Here]`;

    // The method name is slightly different in the new SDK
    const result = await client.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    // This will now give you a clearer error message if it fails
    console.error('Gemini Error:', error.message);
    return [];
  }
};

module.exports = {
  getRecommendations,
};