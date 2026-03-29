const Variant = require('../models/Variant');
const Category = require('../models/Category');
const ProductType = require('../models/ProductType');
const StockMovement = require('../models/StockMovement');
const generateSKU = require('../utils/generateSKU');
const { success, error } = require('../utils/apiResponse');
const { deleteFile } = require('../services/gridfs');
const { uploadFilesForVariant } = require('../services/variantImageService');
const { getResolvedGeneralSettings } = require('../services/generalSettingsService');

const POPULATE_FIELDS = [
  { path: 'category', select: 'name' },
  { path: 'productType', select: 'name hasSizes sizes' },
  { path: 'color', select: 'name hexCode' },
];

const getAll = async (req, res, next) => {
  try {
    const { category, productType, size, color, search, lowStock, page = 1, limit = 25 } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (productType) filter.productType = productType;
    if (size) filter.size = size;
    if (color) filter.color = color;
    if (search) filter.sku = new RegExp(search, 'i');
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$stockQty', '$lowStockThreshold'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Variant.find(filter)
        .populate(POPULATE_FIELDS)
        .select('-__v')
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

const getLowStockCount = async (req, res, next) => {
  try {
    const count = await Variant.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stockQty', '$lowStockThreshold'] },
    });
    return success(res, { count });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const variant = await Variant.findById(req.params.id)
      .populate(POPULATE_FIELDS)
      .select('-__v');
    if (!variant) return error(res, 'Variant not found', 404);
    return success(res, { data: variant });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  let variant;

  try {
    const generalSettings = await getResolvedGeneralSettings();
    const {
      categoryId,
      productTypeId,
      colorId,
      size,
      costPrice,
      sellPrice,
      lowStockThreshold,
      stockQty,
    } = req.body;

    const parsedCostPrice = Number(costPrice);
    const parsedSellPrice = Number(sellPrice);
    const parsedLowStockThreshold =
      lowStockThreshold !== undefined && lowStockThreshold !== ''
        ? Number(lowStockThreshold)
        : generalSettings.defaultLowStockThreshold;
    const parsedStockQty =
      stockQty !== undefined && stockQty !== ''
        ? Number(stockQty)
        : 0;

    // Resolve category name for SKU generation
    const cat = await Category.findById(categoryId);
    const ptype = await ProductType.findById(productTypeId);
    if (!cat) return error(res, 'Category not found', 404);
    if (!ptype) return error(res, 'Product type not found', 404);

    const sku = await generateSKU(cat.name, ptype.name);

    variant = await Variant.create({
      sku,
      category: categoryId,
      productType: productTypeId,
      color: colorId,
      size: size || 'N/A',
      costPrice: parsedCostPrice,
      sellPrice: parsedSellPrice,
      lowStockThreshold: parsedLowStockThreshold,
      stockQty: parsedStockQty,
    });

    if (req.files?.length) {
      await uploadFilesForVariant(req, variant, req.files);
      await variant.save();
    }

    // Create initial IN movement if stockQty > 0
    if (parsedStockQty > 0) {
      await StockMovement.create({
        variant: variant._id,
        type: 'IN',
        qty: parsedStockQty,
        qtyBefore: 0,
        qtyAfter: parsedStockQty,
        costPrice: parsedCostPrice,
        sellPrice: parsedSellPrice,
        qtyRemaining: parsedStockQty,
        reason: 'Initial stock',
      });
    }

    await variant.populate(POPULATE_FIELDS);
    return success(res, { data: variant }, 'Variant created', 201);
  } catch (err) {
    if (variant?._id) {
      try {
        await Promise.all((variant.images || []).map((image) => deleteFile(image.fileId)));
        await Variant.findByIdAndDelete(variant._id);
      } catch (cleanupErr) {
        console.error('Failed to clean up variant after create error:', cleanupErr.message);
      }
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    // Do NOT allow changing category, productType, color — they define variant identity
    const { costPrice, sellPrice, lowStockThreshold, size, isActive } = req.body;
    const updates = {};
    if (costPrice !== undefined) updates.costPrice = costPrice;
    if (sellPrice !== undefined) updates.sellPrice = sellPrice;
    if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;
    if (size !== undefined) updates.size = size;
    if (isActive !== undefined) updates.isActive = isActive;

    const variant = await Variant.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate(POPULATE_FIELDS)
      .select('-__v');
    if (!variant) return error(res, 'Variant not found', 404);
    return success(res, { data: variant });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const variant = await Variant.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!variant) return error(res, 'Variant not found', 404);
    return success(res, { data: variant }, 'Variant deactivated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getLowStockCount, getOne, create, update, remove };
