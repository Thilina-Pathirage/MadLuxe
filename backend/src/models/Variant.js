const mongoose = require('mongoose');

const variantImageSchema = new mongoose.Schema(
  {
    fileId: { type: String, required: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    productType: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductType', required: true },
    size: { type: String, default: 'N/A', trim: true },
    color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color', required: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellPrice: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    images: { type: [variantImageSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

variantSchema.virtual('status').get(function () {
  if (this.stockQty === 0) return 'Out of Stock';
  if (this.stockQty <= this.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
});

module.exports = mongoose.model('Variant', variantSchema);
