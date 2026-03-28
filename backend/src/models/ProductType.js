const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    hasSizes: { type: Boolean, default: false },
    sizes: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productTypeSchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ProductType', productTypeSchema);
