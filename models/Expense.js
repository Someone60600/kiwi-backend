const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  // 1. We link each expense to a specific User
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  
  // 2. Basic Details
  title: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },

  // 3. Extra features (AI & Sorting)
  originalCategory: { 
    type: String, 
    default: 'Other' 
  },
  isIncome: { 
    type: Boolean, 
    default: false 
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
