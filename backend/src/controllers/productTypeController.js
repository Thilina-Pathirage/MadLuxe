const ProductType = require('../models/ProductType');
const Category = require('../models/Category');
const Variant = require('../models/Variant');
const { success, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.includeInactive !== 'true') filter.isActive = true;
    const types = await ProductType.find(filter)
      .populate('category', 'name')
      .select('-__v')
      .sort('name');
    return success(res, { data: types });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const type = await ProductType.findById(req.params.id)
      .populate('category', 'name')
      .select('-__v');
    if (!type) return error(res, 'Product type not found', 404);
    return success(res, { data: type });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { category, name, hasSizes, sizes } = req.body;
    const cat = await Category.findById(category);
    if (!cat) return error(res, 'Category not found', 404);
    const type = await ProductType.create({ category, name, hasSizes, sizes });
    await type.populate('category', 'name');
    return success(res, { data: type }, 'Product type created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, hasSizes, sizes } = req.body;
    const type = await ProductType.findByIdAndUpdate(
      req.params.id,
      { name, hasSizes, sizes },
      { new: true, runValidators: true }
    )
      .populate('category', 'name')
      .select('-__v');
    if (!type) return error(res, 'Product type not found', 404);
    return success(res, { data: type });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const hasVariants = await Variant.exists({ productType: req.params.id });
    if (hasVariants) {
      return error(res, 'Cannot delete product type with existing variants', 400);
    }
    const type = await ProductType.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!type) return error(res, 'Product type not found', 404);
    return success(res, { data: type }, 'Product type deactivated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove };
