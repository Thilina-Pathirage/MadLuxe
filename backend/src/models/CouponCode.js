const mongoose = require('mongoose');

const couponCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    expiryDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CouponCode', couponCodeSchema);
