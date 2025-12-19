const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Expense = require('./models/Expense'); // <--- Importing the model we just made

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
// If you are using MongoDB Atlas (Cloud), replace this URL with your cloud string
const MONGO_URI = 'mongodb+srv://someone60600:utsha4035Nandi@cluster0.vdk9sig.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---

// 1. GET ALL EXPENSES
app.get('/api/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. SYNC EXPENSES (Bulk Add)
app.post('/api/expenses/sync', async (req, res) => {
    const expenses = req.body;
    if (!Array.isArray(expenses)) {
        return res.status(400).json({ message: "Expected a list of expenses" });
    }

    try {
        const operations = expenses.map(exp => ({
            updateOne: {
                filter: { id: exp.id },
                update: { $set: exp },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Expense.bulkWrite(operations);
        }

        res.status(200).json({ message: "Sync successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Sync failed" });
    }
});

// 3. ADD SINGLE EXPENSE
app.post('/api/expenses', async (req, res) => {
    const expense = new Expense(req.body);
    try {
        const newExpense = await expense.save();
        res.status(201).json(newExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 4. DELETE EXPENSE
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        await Expense.deleteOne({ id: req.params.id });
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});