const Variant = require('../models/Variant');
const { success, error } = require('../utils/apiResponse');
const { uploadFilesForVariant } = require('../services/variantImageService');
const { deleteFile, openDownloadStream, findFile, getStorageStats } = require('../services/gridfs');

const uploadImages = async (req, res, next) => {
  try {
    const variant = await Variant.findById(req.params.variantId);
    if (!variant) return error(res, 'Variant not found', 404);

    if (!req.files || req.files.length === 0) {
      return error(res, 'No files uploaded', 400);
    }

    await uploadFilesForVariant(req, variant, req.files);
    await variant.save();
    return success(res, { data: variant.images }, 'Images uploaded', 201);
  } catch (err) {
    next(err);
  }
};

const setPrimary = async (req, res, next) => {
  try {
    const variant = await Variant.findById(req.params.variantId);
    if (!variant) return error(res, 'Variant not found', 404);

    const target = variant.images.id(req.params.imageId);
    if (!target) return error(res, 'Image not found', 404);

    variant.images.forEach((img) => { img.isPrimary = false; });
    target.isPrimary = true;
    await variant.save();

    return success(res, { data: variant.images });
  } catch (err) {
    next(err);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const variant = await Variant.findById(req.params.variantId);
    if (!variant) return error(res, 'Variant not found', 404);

    const img = variant.images.id(req.params.imageId);
    if (!img) return error(res, 'Image not found', 404);

    const wasPrimary = img.isPrimary;
    const { fileId } = img;

    img.deleteOne();

    // Auto-assign primary if needed
    if (wasPrimary && variant.images.length > 0) {
      variant.images[0].isPrimary = true;
    }

    await deleteFile(fileId);
    await variant.save();
    return success(res, { data: variant.images }, 'Image deleted');
  } catch (err) {
    next(err);
  }
};

const streamImage = async (req, res, next) => {
  try {
    const file = await findFile(req.params.fileId);
    if (!file) return error(res, 'Image not found', 404);

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', file.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = openDownloadStream(req.params.fileId);
    stream.on('error', next);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

const getStorageHealth = async (req, res, next) => {
  try {
    const stats = await getStorageStats();
    return success(res, { data: stats });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImages, setPrimary, deleteImage, streamImage, getStorageHealth };
