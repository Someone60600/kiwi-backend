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

// ---------------------------------------------------------
// 🔐 1. CONFIGURATION (API Keys & Database)
// ---------------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.log('⚠️ Warning: MONGO_URI not found in Environment Variables');
}

// Initialize AI
let model;
if (GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} else {
  console.error("❌ ERROR: GEMINI_API_KEY is missing!");
}

// ---------------------------------------------------------
// 🗄️ 2. DATABASE SCHEMA (The missing piece!)
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

app.get('/', (req, res) => {
  res.send('🥝 Kiwi Server is Running! (AI + Database Active)');
});

// ✨ ROUTE 1: AI Auto-Scan (The Logic)
app.post('/api/analyze', async (req, res) => {
  try {
    const { smsText } = req.body;
    console.log("📨 Analyzing SMS:", smsText);

    if (!model) return res.status(500).json({ error: "AI not configured" });
    if (!smsText) return res.status(400).json({ error: "No text provided" });

    const prompt = `
      Analyze this transaction SMS: "${smsText}"
      Return JSON only:
      {
        "merchant": "Store Name",
        "amount": 0.00,
        "category": "Food/Travel/Shopping/Bills/Health/Other",
        "date": "YYYY-MM-DD"
      }
      If not a transaction, return { "error": "not_transaction" }.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(text);
    console.log("✅ AI Success:", data);
    res.json(data);

  } catch (error) {
    console.error("❌ AI Failed:", error);
    res.status(500).json({ message: "AI Error", error: error.message });
  }
});

// 💾 ROUTE 2: Save Expense (Fixes "Cannot POST /api/expenses")
app.post('/api/expenses', async (req, res) => {
  try {
    console.log("💾 Saving Expense:", req.body);
    const newExpense = new Expense(req.body);
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    console.error("❌ Save Failed:", error);
    res.status(500).json({ error: "Failed to save expense" });
  }
});

// 📥 ROUTE 3: Get Expenses (Fixes "Cannot GET /api/expenses/...")
app.get('/api/expenses/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const expenses = await Expense.find({ userId }).sort({ timestamp: -1 });
    console.log(`📤 Sending ${expenses.length} expenses for User ${userId}`);
    res.json(expenses);
  } catch (error) {
    console.error("❌ Fetch Failed:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// 🗑️ ROUTE 4: Delete Expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
