const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
// 👇 1. Import the Google AI Library
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 👇 2. Load API Key from Render Environment Variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check if API Key is missing (Safety Check)
if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is missing in Environment Variables!");
}

// 👇 3. Initialize Gemini with the Safe Key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 👇 4. Use the correct "Flash" model (Fast & Cheap)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- ROUTES ---

app.get('/', (req, res) => {
  res.send('🥝 Kiwi Server is Running! (AI Active)');
});

// ✨ THE MAGIC AI SCANNER ROUTE
app.post('/api/analyze', async (req, res) => {
  try {
    const { smsText } = req.body;
    console.log("📨 Received SMS for analysis:", smsText);

    if (!smsText) {
      return res.status(400).json({ error: "No SMS text provided" });
    }

    // Smart Prompt for the AI
    const prompt = `
      Analyze this bank transaction SMS: "${smsText}"
      Extract the following fields as JSON only (no markdown):
      {
        "merchant": "Name of store/person",
        "amount": 0.00,
        "category": "One of: Food, Travel, Shopping, Bills, Entertainment, Health, Other",
        "date": "YYYY-MM-DD"
      }
      If strictly not a transaction, return { "error": "not_transaction" }.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up potential markdown code blocks (```json ... ```)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(text);
    console.log("✅ AI Analysis Success:", data);
    res.json(data);

  } catch (error) {
    console.error("❌ AI Scan Failed:", error);
    res.status(500).json({ message: "Analysis failed", error: error.message });
  }
});

// (Keep your existing MongoDB /api/expenses routes below if you have them)
// ... 

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
