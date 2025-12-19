const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Import your Models
const Expense = require('./models/Expense');
const MerchantRule = require('./models/MerchantRule'); 

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==========================================
// ✅ FIXED KEYS (I cleaned these for you)
// ==========================================
// I removed the "... (" and ") ..." garbage. These are now clean strings.
const MONGO_DB_URL = "mongodb+srv://someone60600:utsha4035Nandi@cluster0.vdk9sig.mongodb.net/?appName=Cluster0"; 
const GEMINI_API_KEY = "AIzaSyBr5dA-JVVwvihra9Dq-nnf2w-EEvNY1j0";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Connect to MongoDB
mongoose.connect(MONGO_DB_URL)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==========================================
// 🚀 ROUTE 1: HYBRID SMS ANALYSIS
// ==========================================
app.post('/api/analyze-sms', async (req, res) => {
  try {
    const { smsText } = req.body;
    if (!smsText) return res.status(400).json({ message: "No SMS text provided" });

    // 1. Ask Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Analyze this SMS: "${smsText}"
      Return strictly JSON (no markdown):
      {
        "amount": number,
        "merchant": "string (extract clean name, uppercase)",
        "type": "Debit/Credit",
        "date": "YYYY-MM-DD",
        "category": "string (Guess best from: Food, Travel, Shopping, Bills, Other)"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    let data = JSON.parse(text);

    // 2. Check Memory
    if (data.merchant) {
      const knownRule = await MerchantRule.findOne({ merchantName: data.merchant });

      if (knownRule) {
        console.log(`🧠 Memory Hit: Found rule for ${data.merchant}`);
        data.category = knownRule.category; 
        data.isFromMemory = true;
      } else {
        console.log(`🤖 AI New: Learning ${data.merchant}`);
        const newRule = new MerchantRule({
          merchantName: data.merchant,
          category: data.category
        });
        await newRule.save();
        data.isFromMemory = false;
      }
    }

    res.json(data);

  } catch (error) {
    console.error("Error analyzing SMS:", error);
    res.status(500).json({ message: "Analysis failed" });
  }
});

// ==========================================
// 🚀 ROUTE 2: ADD EXPENSE (Updated for Full Data)
// ==========================================
app.post('/api/expenses', async (req, res) => {
  try {
    // 🔍 I added 'category' and 'isIncome' here so you don't lose data!
    const { title, amount, date, userId, category, isIncome } = req.body;

    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const newExpense = new Expense({ 
      title, 
      amount, 
      date, 
      userId,
      originalCategory: category || 'Other', // Save the category
      isIncome: isIncome || false           // Save income status
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 🚀 ROUTE 3: GET EXPENSES (For Specific User)
// ==========================================
app.get('/api/expenses/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const expenses = await Expense.find({ userId: userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 🚀 ROUTE 4: DELETE EXPENSE (Extra Utility)
// ==========================================
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


