const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    hexCode: { type: String, default: '#CCCCCC' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Color', colorSchema);
