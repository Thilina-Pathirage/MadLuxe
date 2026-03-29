const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    landingImage: {
      fileId: { type: String },
      filename: { type: String },
      contentType: { type: String },
      size: { type: Number, min: 0 },
      url: { type: String },
    },
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
