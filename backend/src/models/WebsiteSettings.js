const mongoose = require('mongoose');

const imageAssetSchema = new mongoose.Schema(
  {
    fileId: { type: String, required: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, required: true },
  },
  { _id: false }
);

const heroSlideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    image: { type: imageAssetSchema, default: null },
    sortOrder: { type: Number, min: 0, default: 0 },
  },
  { _id: true }
);

const galleryImageSchema = new mongoose.Schema(
  {
    fileId: { type: String, required: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, required: true },
  },
  { _id: true }
);

const websiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'website', unique: true, immutable: true },
    heroAutoSlide: { type: Boolean, default: true },
    galleryImages: { type: [galleryImageSchema], default: [] },
    heroSlides: {
      type: [heroSlideSchema],
      default: [
        {
          title: 'New Arrivals, Built To Move',
          subtitle: 'Fresh silhouettes and polished textures curated for everyday impact.',
          sortOrder: 0,
        },
      ],
      validate: {
        validator: (slides) => Array.isArray(slides) && slides.length >= 1 && slides.length <= 6,
        message: 'Hero slides must contain between 1 and 6 items',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);
