const Category = require('../models/Category');
const ProductType = require('../models/ProductType');
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
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
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

module.exports = { getAll, getOne, create, update, remove };
