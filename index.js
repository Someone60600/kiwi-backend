const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// ---------------------------------------------------------
// 🔐 1. CONFIGURATION
// ---------------------------------------------------------
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected (Fast Mode)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.log('⚠️ Warning: MONGO_URI is missing!');
}

// ---------------------------------------------------------
// 🗄️ 2. DATABASE SCHEMA (Optimized)
// ---------------------------------------------------------
const ExpenseSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, 
  type: { type: String, default: 'expense' }, // 'income' or 'expense'
  merchant: String,
  amount: Number,
  category: String,
  date: String,
  timestamp: { type: Date, default: Date.now }
});

// 🛡️ NO DUPLICATES: Check combination of User + Amount + Merchant + Date + Type
ExpenseSchema.index({ userId: 1, amount: 1, merchant: 1, date: 1, type: 1 }, { unique: false });

const Expense = mongoose.model('Expense', ExpenseSchema);

// ---------------------------------------------------------
// 🚀 3. ROUTES
// ---------------------------------------------------------

app.get('/', (req, res) => res.send('🥝 Kiwi Server V4 (No AI - Database Only)'));

// 💾 SAVE TRANSACTION (Smart Duplicate Check)
app.post('/api/expenses', async (req, res) => {
  try {
    const { userId, amount, merchant, date, type } = req.body;

    // 1. Guard Dog: Check if this transaction already exists
    const existingTransaction = await Expense.findOne({
      userId,
      amount,
      merchant,
      date,
      type
    });

    if (existingTransaction) {
      console.log("⚠️ Blocked Duplicate:", merchant, amount);
      return res.status(200).json({ message: "Duplicate skipped", skipped: true });
    }

    // 2. Save New Transaction
    const newExpense = new Expense(req.body);
    await newExpense.save();
    console.log(`✅ Saved ${type}:`, merchant, amount);
    res.status(201).json(newExpense);

  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ error: "Save failed" });
  }
});

// 📥 GET TRANSACTIONS (Fast Fetch)
app.get('/api/expenses/:userId', async (req, res) => {
  try {
    // .lean() makes it run faster
    const expenses = await Expense.find({ userId: req.params.userId })
                                  .sort({ date: -1, timestamp: -1 })
                                  .lean(); 
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// 🗑️ DELETE TRANSACTION
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
