// This is the code for your new backend function.
// For Netlify, save this file as: /netlify/functions/analyze.js
// For Vercel, save this file as: /api/analyze.js

// Using 'node-fetch' to make requests from the backend.
// You'll need to add this to your package.json: npm install node-fetch
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Get the user's prompt from the frontend request
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
        }

        // Securely get the API key from environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured on the server.' }) };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;

        // Construct the payload for the Gemini API
        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };

        // Call the Gemini API from the secure backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Gemini API Error:', errorBody);
            return { statusCode: response.status, body: JSON.stringify({ error: errorBody.error.message || 'Failed to get response from Gemini API.' }) };
        }

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;

        // Send the successful response back to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ text: text })
        };

    } catch (error) {
        console.error('Server-side error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
