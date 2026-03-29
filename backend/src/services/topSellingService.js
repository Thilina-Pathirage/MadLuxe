const Order = require('../models/Order');
const Variant = require('../models/Variant');

const round2 = (n) => Math.round(n * 100) / 100;

const DEFAULT_POPULATE_FIELDS = [
  { path: 'category', select: 'name' },
  { path: 'productType', select: 'name' },
  { path: 'color', select: 'name hexCode' },
];

const parseLimit = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
};

const getTopSellingVariants = async ({
  limit = 5,
  dateFrom,
  dateTo,
  variantFilter,
  includeMissingVariants = true,
  populateFields = DEFAULT_POPULATE_FIELDS,
} = {}) => {
  const safeLimit = parseLimit(limit, 5);

  const orderFilter = { status: 'Completed' };
  if (dateFrom || dateTo) {
    orderFilter.createdAt = {};
    if (dateFrom) orderFilter.createdAt.$gte = dateFrom;
    if (dateTo) orderFilter.createdAt.$lte = dateTo;
  }

  const orders = await Order.find(orderFilter).select('items');

  const salesMap = {};
  for (const order of orders) {
    for (const item of order.items) {
      const id = item.variant.toString();
      if (!salesMap[id]) salesMap[id] = { variantId: id, totalQtySold: 0, totalRevenue: 0 };
      salesMap[id].totalQtySold += item.qty;
      salesMap[id].totalRevenue += item.lineFinal;
    }
  }

  const rankedSales = Object.values(salesMap).sort((a, b) => b.totalQtySold - a.totalQtySold);
  if (rankedSales.length === 0) return [];

  if (variantFilter && Object.keys(variantFilter).length > 0) {
    const rankedIds = rankedSales.map((item) => item.variantId);
    const variants = await Variant.find({ _id: { $in: rankedIds }, ...variantFilter })
      .populate(populateFields)
      .select('-__v');

    const variantsById = new Map(variants.map((variant) => [variant._id.toString(), variant]));

    return rankedSales
      .filter((item) => variantsById.has(item.variantId))
      .slice(0, safeLimit)
      .map((item) => ({
        variant: variantsById.get(item.variantId),
        totalQtySold: item.totalQtySold,
        totalRevenue: round2(item.totalRevenue),
      }));
  }

  const topRanked = rankedSales.slice(0, safeLimit);
  const variants = await Variant.find({ _id: { $in: topRanked.map((item) => item.variantId) } })
    .populate(populateFields)
    .select('-__v');

  const variantsById = new Map(variants.map((variant) => [variant._id.toString(), variant]));

  return topRanked
    .filter((item) => includeMissingVariants || variantsById.has(item.variantId))
    .map((item) => ({
      variant: variantsById.get(item.variantId) ?? null,
      totalQtySold: item.totalQtySold,
      totalRevenue: round2(item.totalRevenue),
    }));
};

module.exports = { getTopSellingVariants };
