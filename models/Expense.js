const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    originalCategory: { type: String, default: 'Other' },
    isIncome: { type: Boolean, default: false }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
