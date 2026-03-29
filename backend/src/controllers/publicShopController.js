const Variant = require('../models/Variant');
const ProductType = require('../models/ProductType');
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
  getPublicVariants,
  getPublicVariantById,
  getPublicProductTypes,
  getPublicSettings,
  getPublicTopSelling,
};
