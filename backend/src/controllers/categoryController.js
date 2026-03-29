const Category = require('../models/Category');
const ProductType = require('../models/ProductType');
const { uploadBuffer, deleteFile } = require('../services/gridfs');
const { buildImageUrl } = require('../services/variantImageService');
const { success, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.includeInactive !== 'true') filter.isActive = true;
    const categories = await Category.find(filter).select('-__v').sort('name');
    return success(res, { data: categories });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).select('-__v');
    if (!category) return error(res, 'Category not found', 404);
    return success(res, { data: category });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ name, description });
    return success(res, { data: category }, 'Category created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const updates = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      updates.name = req.body.name;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      updates.description = req.body.description;
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');
    if (!category) return error(res, 'Category not found', 404);
    return success(res, { data: category });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const hasTypes = await ProductType.exists({ category: req.params.id });
    if (hasTypes) {
      return error(res, 'Cannot delete category with existing product types', 400);
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!category) return error(res, 'Category not found', 404);
    return success(res, { data: category }, 'Category deactivated');
  } catch (err) {
    next(err);
  }
};

const uploadLandingImage = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).select('-__v');
    if (!category) return error(res, 'Category not found', 404);

    if (!req.file) {
      return error(res, 'No file uploaded', 400);
    }

    if (category.landingImage?.fileId) {
      await deleteFile(category.landingImage.fileId);
    }

    const stored = await uploadBuffer({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      metadata: {
        entity: 'category-landing',
        categoryId: category._id.toString(),
        uploadedBy: req.user?.id,
      },
    });

    category.landingImage = {
      fileId: stored.fileId,
      filename: stored.filename,
      contentType: stored.contentType,
      size: stored.size,
      url: buildImageUrl(stored.fileId),
    };

    await category.save();
    return success(res, { data: category }, 'Category landing image updated');
  } catch (err) {
    next(err);
  }
};

const removeLandingImage = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).select('-__v');
    if (!category) return error(res, 'Category not found', 404);

    if (category.landingImage?.fileId) {
      await deleteFile(category.landingImage.fileId);
      category.landingImage = undefined;
      await category.save();
    }

    return success(res, { data: category }, 'Category landing image removed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  uploadLandingImage,
  removeLandingImage,
};
