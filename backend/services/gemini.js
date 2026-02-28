const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getRecommendations = async (userLocation, userDestination, availablePosts) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Given the following information, recommend the best posts for this user to connect with others going home:
      
      User's Current Location: ${JSON.stringify(userLocation)}
      User's Destination: ${JSON.stringify(userDestination)}
      Available Posts: ${JSON.stringify(availablePosts)}
      
      Consider:
      1. Distance and time efficiency
      2. User preferences (age, gender)
      3. Similar routes and destinations
      4. Safety factors
      
      Return a JSON array with post IDs ranked by recommendation score (0-100), with explanations.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    console.error('Error getting recommendations from Gemini:', error);
    return [];
  }
};

module.exports = {
  getRecommendations,
};
