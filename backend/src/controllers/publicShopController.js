const Variant = require('../models/Variant');
const ProductType = require('../models/ProductType');
const StockMovement = require('../models/StockMovement');
const mongoose = require('mongoose');
const { success, error } = require('../utils/apiResponse');
const { getResolvedGeneralSettings } = require('../services/generalSettingsService');
const { getTopSellingVariants } = require('../services/topSellingService');
const { calculateDeliveryFee } = require('../utils/deliveryPricing');

const POPULATE_FIELDS = [
  { path: 'category', select: 'name' },
  { path: 'productType', select: 'name' },
  { path: 'color', select: 'name hexCode' },
];

const getPublicVariants = async (req, res, next) => {
  try {
    const { category, productType, inStock, page = 1, limit = 24 } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (productType) filter.productType = productType;
    if (inStock === 'true') filter.stockQty = { $gt: 0 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Variant.find(filter)
        .populate(POPULATE_FIELDS)
        .select('sku category productType color size weightGrams sellPrice stockQty images createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Variant.countDocuments(filter),
    ]);

    return success(res, {
      data,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

const getPublicBatches = async (req, res, next) => {
  try {
    const { category, productType, variant, inStock = 'false', search, page = 1, limit = 24 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 24, 1);
    const inStockOnly = inStock === 'true';
    const searchTerm = typeof search === 'string' ? search.trim().toLowerCase() : '';

    const filter = { type: 'IN' };
    if (variant) filter.variant = variant;
    if (inStockOnly) filter.qtyRemaining = { $gt: 0 };

    let data = await StockMovement.find(filter)
      .populate({
        path: 'variant',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'productType', select: 'name' },
          { path: 'color', select: 'name hexCode' },
        ],
        select: 'sku category productType color size weightGrams stockQty sellPrice images createdAt isActive',
      })
      .select('_id variant sellPrice qtyRemaining createdAt')
      .sort({ createdAt: -1 });

    data = data.filter((movement) => {
      const v = movement.variant;
      if (!v || v.isActive === false) return false;
      if (category && (!v.category || v.category._id.toString() !== category)) return false;
      if (productType && (!v.productType || v.productType._id.toString() !== productType)) return false;

      const remaining = Number(movement.qtyRemaining ?? 0);
      if (inStockOnly) return remaining > 0;
      if (remaining < 0) return false;

      if (searchTerm) {
        const searchable = [
          v.sku,
          v.category?.name,
          v.productType?.name,
          v.color?.name,
        ]
          .filter(Boolean)
          .map((item) => String(item).toLowerCase());

        return searchable.some((value) => value.includes(searchTerm));
      }

      return true;
    });

    const total = data.length;
    const start = (pageNum - 1) * limitNum;
    const paginated = data.slice(start, start + limitNum);

    const safeData = paginated.map((movement) => {
      const v = movement.variant;
      const safeSellPrice = movement.sellPrice != null ? movement.sellPrice : (v?.sellPrice ?? 0);
      return {
        _id: movement._id,
        batchId: movement._id,
        createdAt: movement.createdAt,
        sellPrice: safeSellPrice,
        qtyRemaining: Number(movement.qtyRemaining ?? 0),
        variant: v
          ? {
              _id: v._id,
              sku: v.sku,
              category: v.category,
              productType: v.productType,
              color: v.color,
              size: v.size,
              weightGrams: v.weightGrams,
              stockQty: v.stockQty,
              images: v.images,
              createdAt: v.createdAt,
            }
          : null,
      };
    });

    return success(res, {
      data: safeData,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

const getPublicVariantById = async (req, res, next) => {
  try {
    const data = await Variant.findOne({ _id: req.params.id, isActive: true })
      .populate(POPULATE_FIELDS)
      .select('sku category productType color size weightGrams sellPrice stockQty images createdAt');

    if (!data) return error(res, 'Product not found', 404);

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const getPublicProductTypes = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;

    const data = await ProductType.find(filter)
      .populate({ path: 'category', select: 'name' })
      .select('name category')
      .sort('name');

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getResolvedGeneralSettings();
    return success(res, {
      data: {
        currencyCode: settings.currencyCode,
        timezone: settings.timezone,
        defaultDeliveryFee: settings.defaultDeliveryFee,
        deliveryPricing: settings.deliveryPricing,
        sellerWhatsappPhone: settings.sellerWhatsappPhone || '',
      },
    });
  } catch (err) {
    next(err);
  }
};

const quotePublicDelivery = async (req, res, next) => {
  try {
    const { customerProvince, items: rawItems } = req.body || {};
    if (!customerProvince || !String(customerProvince).trim()) {
      return error(res, 'Customer province is required', 400);
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return error(res, 'Items are required to calculate delivery fee', 400);
    }

    const normalizedItems = rawItems
      .map((item) => ({
        variantId: String(item?.variantId || '').trim(),
        qty: Number(item?.qty || 0),
      }))
      .filter((item) => item.variantId && Number.isInteger(item.qty) && item.qty > 0);

    if (!normalizedItems.length) {
      return error(res, 'Items must include valid variantId and qty values', 400);
    }
    if (normalizedItems.some((item) => !mongoose.Types.ObjectId.isValid(item.variantId))) {
      return error(res, 'Items must include valid variant IDs', 400);
    }

    const variantIds = Array.from(new Set(normalizedItems.map((item) => item.variantId)));
    const variants = await Variant.find({ _id: { $in: variantIds }, isActive: true })
      .select('_id weightGrams')
      .lean();
    const variantMap = new Map(variants.map((variant) => [String(variant._id), variant]));

    let totalWeightGrams = 0;
    for (const item of normalizedItems) {
      const variant = variantMap.get(item.variantId);
      if (!variant) return error(res, 'One or more selected products are unavailable', 400);
      const unitWeight = Math.max(1, Math.round(Number(variant.weightGrams) || 1000));
      totalWeightGrams += unitWeight * item.qty;
    }

    const settings = await getResolvedGeneralSettings();
    const calculation = calculateDeliveryFee({
      province: customerProvince,
      totalWeightGrams,
      deliveryPricing: settings.deliveryPricing,
      fallbackBaseFee: Number(settings.defaultDeliveryFee ?? 300),
    });

    return success(res, {
      data: {
        customerProvince: calculation.province,
        totalWeightGrams: calculation.totalWeightGrams,
        deliveryFee: calculation.deliveryFee,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getPublicTopSelling = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;
    const data = await getTopSellingVariants({
      limit,
      variantFilter: { isActive: true, stockQty: { $gt: 0 } },
      includeMissingVariants: false,
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicBatches,
  getPublicVariants,
  getPublicVariantById,
  getPublicProductTypes,
  getPublicSettings,
  quotePublicDelivery,
  getPublicTopSelling,
};
