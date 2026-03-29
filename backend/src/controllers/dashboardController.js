const Variant = require('../models/Variant');
const Order = require('../models/Order');
const StockMovement = require('../models/StockMovement');
const { success } = require('../utils/apiResponse');
const { getResolvedGeneralSettings } = require('../services/generalSettingsService');
const { getTopSellingVariants } = require('../services/topSellingService');
const { getBusinessMonthRange } = require('../utils/businessTime');

const round2 = (n) => Math.round(n * 100) / 100;

const getStats = async (req, res, next) => {
  try {
    const generalSettings = await getResolvedGeneralSettings();
    const { dateFrom: monthStart, dateTo: monthEnd } = getBusinessMonthRange(new Date(), generalSettings.timezone);

    const [
      totalVariants,
      lowStockCount,
      outOfStockCount,
      stockValueAgg,
      monthOrders,
      recentMovements,
    ] = await Promise.all([
      Variant.countDocuments({ isActive: true }),
      Variant.countDocuments({ isActive: true, $expr: { $lte: ['$stockQty', '$lowStockThreshold'] } }),
      Variant.countDocuments({ isActive: true, stockQty: 0 }),
      StockMovement.aggregate([
        { $match: { type: 'IN', qtyRemaining: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$qtyRemaining', '$costPrice'] } } } },
      ]),
      Order.find({
        status: 'Completed',
        createdAt: { $gte: monthStart, $lte: monthEnd },
      }).select('total items'),
      StockMovement.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
          path: 'variant',
          populate: [
            { path: 'category', select: 'name' },
            { path: 'productType', select: 'name' },
            { path: 'color', select: 'name' },
          ],
          select: 'sku size images',
        })
        .select('-__v'),
    ]);

    const stockValue = round2(stockValueAgg[0]?.total || 0);

    let monthRevenue = 0;
    let monthCost = 0;

    for (const order of monthOrders) {
      monthRevenue += order.total;
      for (const item of order.items) {
        monthCost += item.costPrice * item.qty;
      }
    }

    const monthProfit = round2(monthRevenue - monthCost);
    const topVariants = await getTopSellingVariants({
      limit: 5,
      dateFrom: monthStart,
      dateTo: monthEnd,
    });

    return success(res, {
      data: {
        totalVariants,
        stockValue,
        lowStockCount,
        outOfStockCount,
        todayRevenue: round2(monthRevenue), // kept as monthRevenue, frontend can rename
        monthlyProfit: monthProfit,
        monthOrders: monthOrders.length,
        recentMovements,
        topSelling: topVariants,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
