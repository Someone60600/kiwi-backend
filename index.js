const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 🔐 LOADS API KEY FROM RENDER
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 🗄️ CONNECT TO DATABASE (Make sure you have this!)
const mongoUri = process.env.MONGO_URI; 
if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.log('⚠️ Warning: MONGO_URI not found in Environment Variables');
}

// --- ROUTES ---

app.get('/', (req, res) => {
  res.send('🥝 Kiwi Server is Running! (AI Active)');
});

// ✨ AI SCANNER ROUTE
app.post('/api/analyze', async (req, res) => {
  try {
    const { smsText } = req.body;
    console.log("📨 Received SMS:", smsText);

    if (!smsText) return res.status(400).json({ error: "No SMS text provided" });

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
    text = text.replace(/```json/g, '').replace(/```/g, '').trim(); // Clean Markdown

    const data = JSON.parse(text);
    console.log("✅ AI Analysis Success:", data);
    res.json(data);

  } catch (error) {
    console.error("❌ AI Scan Failed:", error);
    res.status(500).json({ message: "Analysis failed", error: error.message });
  }
});

// 👇 PASTE YOUR OLD "/api/expenses" ROUTES HERE IF YOU HAD THEM
// app.post('/api/expenses', ...);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
