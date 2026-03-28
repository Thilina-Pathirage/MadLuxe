const Color = require('../models/Color');
const Variant = require('../models/Variant');
const { success, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.includeInactive !== 'true') filter.isActive = true;
    const colors = await Color.find(filter).select('-__v').sort('name');
    return success(res, { data: colors });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const color = await Color.findById(req.params.id).select('-__v');
    if (!color) return error(res, 'Color not found', 404);
    return success(res, { data: color });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, hexCode } = req.body;
    const color = await Color.create({ name, hexCode });
    return success(res, { data: color }, 'Color created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, hexCode } = req.body;
    const color = await Color.findByIdAndUpdate(
      req.params.id,
      { name, hexCode },
      { new: true, runValidators: true }
    ).select('-__v');
    if (!color) return error(res, 'Color not found', 404);
    return success(res, { data: color });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const hasVariants = await Variant.exists({ color: req.params.id });
    if (hasVariants) {
      return error(res, 'Cannot delete color with existing variants', 400);
    }
    const color = await Color.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!color) return error(res, 'Color not found', 404);
    return success(res, { data: color }, 'Color deactivated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove };
