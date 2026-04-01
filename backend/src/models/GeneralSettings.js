const mongoose = require('mongoose');
const { DEFAULT_BASE_WEIGHT_GRAMS, DEFAULT_ADDITIONAL_PER_KG_FEE, DEFAULT_PROVINCE_BASE_FEES } = require('../utils/deliveryPricing');

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
    deliveryPricing: {
      provinceBaseFees: {
        Western: { type: Number, min: 0, default: DEFAULT_PROVINCE_BASE_FEES.Western },
        Central: { type: Number, min: 0, default: DEFAULT_PROVINCE_BASE_FEES.Central },
        Southern: { type: Number, min: 0, default: DEFAULT_PROVINCE_BASE_FEES.Southern },
        Northern: { type: Number, min: 0, default: DEFAULT_PROVINCE_BASE_FEES.Northern },
        Eastern: { type: Number, min: 0, default: DEFAULT_PROVINCE_BASE_FEES.Eastern },
        'North Western': { type: Number, min: 0, default: DEFAULT_PROVINCE_BASE_FEES['North Western'] },
        'North Central': { type: Number, min: 0, default: DEFAULT_PROVINCE_BASE_FEES['North Central'] },
        Uva: { type: Number, min: 0, default: DEFAULT_PROVINCE_BASE_FEES.Uva },
        Sabaragamuwa: { type: Number, min: 0, default: DEFAULT_PROVINCE_BASE_FEES.Sabaragamuwa },
      },
      baseWeightGrams: { type: Number, min: 1, default: DEFAULT_BASE_WEIGHT_GRAMS },
      additionalPerKgFee: { type: Number, min: 0, default: DEFAULT_ADDITIONAL_PER_KG_FEE },
    },
    sellerWhatsappPhone: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GeneralSettings', generalSettingsSchema);
