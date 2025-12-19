const mongoose = require('mongoose');

const MerchantRuleSchema = new mongoose.Schema({
  merchantName: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  learnedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MerchantRule', MerchantRuleSchema);
