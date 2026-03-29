const mongoose = require('mongoose');

const generalSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'general', unique: true, immutable: true },
    currencyCode: {
      type: String,
      enum: ['LKR', 'USD', 'EUR', 'GBP'],
      default: 'LKR',
    },
    timezone: {
      type: String,
      default: 'Asia/Colombo',
      trim: true,
    },
    defaultLowStockThreshold: {
      type: Number,
      min: 0,
      default: 5,
    },
    defaultDeliveryFee: {
      type: Number,
      min: 0,
      default: 300,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GeneralSettings', generalSettingsSchema);
