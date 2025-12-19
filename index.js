const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
// 👇 Imports the correct library
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// ---------------------------------------------------------
// 🔐 1. CONFIGURATION
// ---------------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.log('⚠️ Warning: MONGO_URI is missing in Render Environment!');
}

// Initialize AI
let model;
if (GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // 👇 Using the correct model for the new library
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

// ---------------------------------------------------------
// 🗄️ 2. DATABASE SCHEMA
// ---------------------------------------------------------
const ExpenseSchema = new mongoose.Schema({
  userId: String,
  merchant: String,
  amount: Number,
  category: String,
  date: String,
  timestamp: { type: Date, default: Date.now }
});
const Expense = mongoose.model('Expense', ExpenseSchema);

// ---------------------------------------------------------
// 🚀 3. ROUTES
// ---------------------------------------------------------

app.get('/', (req, res) => res.send('🥝 Kiwi Server is Running!'));

// ✨ AI Route
app.post('/api/analyze', async (req, res) => {
  try {
    const { smsText } = req.body;
    if (!model) return res.status(500).json({ error: "AI key missing" });
    
    const prompt = `Analyze this SMS: "${smsText}". Return JSON: { "merchant": "", "amount": 0, "category": "", "date": "" }`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 💾 Save Expense Route (This fixes "Cannot POST")
app.post('/api/expenses', async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
    await newExpense.save();
    console.log("✅ Expense Saved!");
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: "Save failed" });
  }
});

// 📥 Get Expenses Route (This fixes "Cannot GET")
app.get('/api/expenses/:userId', async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.params.userId }).sort({ timestamp: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
