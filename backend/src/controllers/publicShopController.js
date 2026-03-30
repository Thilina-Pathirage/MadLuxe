const Variant = require('../models/Variant');
const ProductType = require('../models/ProductType');
const StockMovement = require('../models/StockMovement');
const { success, error } = require('../utils/apiResponse');
const { getOrCreateGeneralSettings } = require('../services/generalSettingsService');
const { getTopSellingVariants } = require('../services/topSellingService');

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
        .select('sku category productType color size sellPrice stockQty images createdAt')
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
    const { category, productType, variant, inStock = 'false', page = 1, limit = 24 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 24, 1);
    const inStockOnly = inStock === 'true';

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
        select: 'sku category productType color size stockQty sellPrice images createdAt isActive',
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
      return remaining >= 0;
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
      .select('sku category productType color size sellPrice stockQty images createdAt');

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
    const settings = await getOrCreateGeneralSettings();
    return success(res, {
      data: {
        currencyCode: settings.currencyCode,
        timezone: settings.timezone,
        defaultDeliveryFee: settings.defaultDeliveryFee,
        sellerWhatsappPhone: settings.sellerWhatsappPhone || '',
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
  getPublicTopSelling,
};
