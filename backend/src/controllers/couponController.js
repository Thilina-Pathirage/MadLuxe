const CouponCode = require('../models/CouponCode');
const { success, error } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.activeOnly === 'true') filter.isActive = true;
    const coupons = await CouponCode.find(filter).select('-__v').sort('code');
    return success(res, { data: coupons });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const coupon = await CouponCode.findById(req.params.id).select('-__v');
    if (!coupon) return error(res, 'Coupon not found', 404);
    return success(res, { data: coupon });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { code, type, value, minOrderValue, usageLimit, expiryDate } = req.body;
    if (type === 'percent' && value > 100) {
      return error(res, 'Percent discount cannot exceed 100', 400);
    }
    const coupon = await CouponCode.create({ code, type, value, minOrderValue, usageLimit, expiryDate });
    return success(res, { data: coupon }, 'Coupon created', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { code, type, value, minOrderValue, usageLimit, expiryDate, isActive } = req.body;
    if (type === 'percent' && value > 100) {
      return error(res, 'Percent discount cannot exceed 100', 400);
    }
    const coupon = await CouponCode.findByIdAndUpdate(
      req.params.id,
      { code, type, value, minOrderValue, usageLimit, expiryDate, isActive },
      { new: true, runValidators: true }
    ).select('-__v');
    if (!coupon) return error(res, 'Coupon not found', 404);
    return success(res, { data: coupon });
  } catch (err) {
    next(err);
  }
};

const toggle = async (req, res, next) => {
  try {
    const coupon = await CouponCode.findById(req.params.id);
    if (!coupon) return error(res, 'Coupon not found', 404);
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return success(res, { data: coupon });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const coupon = await CouponCode.findById(req.params.id);
    if (!coupon) return error(res, 'Coupon not found', 404);
    if (coupon.usedCount > 0) {
      return error(res, 'Cannot delete a coupon that has been used', 400);
    }
    await coupon.deleteOne();
    return success(res, {}, 'Coupon deleted');
  } catch (err) {
    next(err);
  }
};

const validate = async (req, res, next) => {
  try {
    const { code, orderSubtotal } = req.body;

    const coupon = await CouponCode.findOne({ code: code.toUpperCase() });

    if (!coupon) return success(res, { valid: false, reason: 'Coupon not found' });
    if (!coupon.isActive) return success(res, { valid: false, reason: 'Coupon is inactive' });
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return success(res, { valid: false, reason: 'Coupon has expired' });
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return success(res, { valid: false, reason: 'Coupon usage limit reached' });
    }
    if (coupon.minOrderValue !== null && orderSubtotal < coupon.minOrderValue) {
      return success(res, {
        valid: false,
        reason: `Minimum order value of £${coupon.minOrderValue} required`,
      });
    }

    const discountAmount =
      coupon.type === 'percent'
        ? Math.round((orderSubtotal * coupon.value) / 100 * 100) / 100
        : coupon.value;

    return success(res, { valid: true, coupon, discountAmount });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, toggle, remove, validate };
