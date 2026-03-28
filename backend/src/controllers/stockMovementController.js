const StockMovement = require('../models/StockMovement');
const Variant = require('../models/Variant');
const { success, error } = require('../utils/apiResponse');

const VARIANT_POPULATE = [
  { path: 'variant', populate: [
    { path: 'category', select: 'name' },
    { path: 'productType', select: 'name' },
    { path: 'color', select: 'name hexCode' },
  ], select: 'sku size images stockQty' },
];

const getAll = async (req, res, next) => {
  try {
    const { type, variant, category, dateFrom, dateTo, search, page = 1, limit = 25 } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (variant) filter.variant = variant;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = StockMovement.find(filter)
      .populate(VARIANT_POPULATE)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const [data, total] = await Promise.all([query, StockMovement.countDocuments(filter)]);

    // Filter by category after populate if requested
    const filtered = category
      ? data.filter((m) => m.variant && m.variant.category && m.variant.category._id.toString() === category)
      : data;

    return success(res, {
      data: filtered,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

const stockIn = async (req, res, next) => {
  try {
    const { variantId, qty, costPrice, sellPrice, supplier, notes } = req.body;

    if (!qty || qty < 1) return error(res, 'Quantity must be at least 1', 400);

    const variant = await Variant.findById(variantId);
    if (!variant) return error(res, 'Variant not found', 404);
    if (!variant.isActive) return error(res, 'Variant is inactive', 400);

    const qtyBefore = variant.stockQty;
    const qtyAfter = qtyBefore + qty;

    // FIFO: Don't overwrite costPrice. Each batch tracks its own cost via StockMovement.
    // Only increment total stock quantity.
    const updatedVariant = await Variant.findByIdAndUpdate(
      variantId,
      { $inc: { stockQty: qty } },
      { new: true }
    );

    // Resolve sellPrice: use provided value, or fallback to variant's current sellPrice
    const resolvedSellPrice = sellPrice != null ? sellPrice : variant.sellPrice;

    // Create batch record: this 'IN' movement is a batch with full qty available
    const movement = await StockMovement.create({
      variant: variantId,
      type: 'IN',
      qty,
      qtyBefore,
      qtyAfter,
      costPrice,
      sellPrice: resolvedSellPrice,
      supplier: supplier || '',
      notes: notes || '',
      qtyRemaining: qty, // Track how much of this batch is still available for FIFO allocation
      createdBy: 'Admin',
    });

    return success(res, { movement, updatedVariant }, 'Stock added', 201);
  } catch (err) {
    next(err);
  }
};

const adjust = async (req, res, next) => {
  try {
    const { variantId, adjustDirection, qty, reason, notes } = req.body;

    if (!reason || reason.trim() === '') return error(res, 'Reason is required for adjustments', 400);
    if (!qty || qty < 1) return error(res, 'Quantity must be at least 1', 400);

    const variant = await Variant.findById(variantId);
    if (!variant) return error(res, 'Variant not found', 404);

    const qtyBefore = variant.stockQty;
    const delta = adjustDirection === 'reduce' ? -qty : qty;
    const qtyAfter = qtyBefore + delta;

    if (qtyAfter < 0) return error(res, 'Adjustment would result in negative stock', 400);

    const updatedVariant = await Variant.findByIdAndUpdate(
      variantId,
      { $inc: { stockQty: delta } },
      { new: true }
    );

    const movement = await StockMovement.create({
      variant: variantId,
      type: 'ADJUST',
      adjustDirection,
      qty,
      qtyBefore,
      qtyAfter,
      reason,
      notes: notes || '',
    });

    return success(res, { movement, updatedVariant }, 'Stock adjusted', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, stockIn, adjust };
