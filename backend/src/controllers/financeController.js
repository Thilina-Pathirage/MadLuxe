const Order = require('../models/Order');
const { success } = require('../utils/apiResponse');

const round2 = (n) => Math.round(n * 100) / 100;

const getSummary = async (req, res, next) => {
  try {
    const { period = 'monthly', year, month, paymentMethod, dateFrom: qDateFrom, dateTo: qDateTo } = req.query;

    let dateFrom, dateTo;
    if (qDateFrom && qDateTo) {
      dateFrom = new Date(qDateFrom);
      dateTo = new Date(qDateTo);
      dateTo.setHours(23, 59, 59, 999);
    } else if (period === 'daily' && month) {
      const [y, m] = month.split('-').map(Number);
      dateFrom = new Date(y, m - 1, 1);
      dateTo = new Date(y, m, 0, 23, 59, 59, 999);
    } else {
      const y = parseInt(year) || new Date().getFullYear();
      dateFrom = new Date(y, 0, 1);
      dateTo = new Date(y, 11, 31, 23, 59, 59, 999);
    }

    const filter = { status: 'Completed', createdAt: { $gte: dateFrom, $lte: dateTo } };
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const orders = await Order.find(filter).select('total items createdAt paymentMethod');

    let totalRevenue = 0;
    let totalCost = 0;

    const buckets = {};

    for (const order of orders) {
      totalRevenue += order.total;
      let orderCost = 0;
      for (const item of order.items) {
        // costPrice is now the actual batch cost (from FIFO allocation), not variant average
        orderCost += item.costPrice * item.qty;
      }
      totalCost += orderCost;

      // Group by bucket label
      const d = new Date(order.createdAt);
      const label =
        period === 'daily'
          ? String(d.getDate())
          : d.toLocaleString('default', { month: 'short' });

      if (!buckets[label]) buckets[label] = { revenue: 0, cost: 0 };
      buckets[label].revenue += order.total;
      buckets[label].cost += orderCost;
    }

    let codReceivable = 0;
    let codOrderCount = 0;
    for (const order of orders) {
      if (order.paymentMethod === 'COD') {
        codReceivable += order.total;
        codOrderCount++;
      }
    }

    const grossProfit = round2(totalRevenue - totalCost);
    const profitMargin =
      totalRevenue > 0 ? round2((grossProfit / totalRevenue) * 100) : 0;

    // Build chart data in order
    let chartData;
    if (period === 'daily') {
      const [y, m] = (month || '').split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const label = String(i + 1);
        const b = buckets[label] || { revenue: 0, cost: 0 };
        return { label, revenue: round2(b.revenue), cost: round2(b.cost), profit: round2(b.revenue - b.cost) };
      });
    } else {
      const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      chartData = MONTHS.map((label) => {
        const b = buckets[label] || { revenue: 0, cost: 0 };
        return { label, revenue: round2(b.revenue), cost: round2(b.cost), profit: round2(b.revenue - b.cost) };
      });
    }

    return success(res, {
      data: {
        totalRevenue: round2(totalRevenue),
        totalCost: round2(totalCost),
        grossProfit,
        profitMargin,
        codReceivable: round2(codReceivable),
        codOrderCount,
        chartData,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getBreakdown = async (req, res, next) => {
  try {
    const { period = 'monthly', year, month, category, paymentMethod, dateFrom: qDateFrom, dateTo: qDateTo, page = 1, limit = 25 } = req.query;

    let dateFrom, dateTo;
    if (qDateFrom && qDateTo) {
      dateFrom = new Date(qDateFrom);
      dateTo = new Date(qDateTo);
      dateTo.setHours(23, 59, 59, 999);
    } else if (period === 'daily' && month) {
      const [y, m] = month.split('-').map(Number);
      dateFrom = new Date(y, m - 1, 1);
      dateTo = new Date(y, m, 0, 23, 59, 59, 999);
    } else {
      const y = parseInt(year) || new Date().getFullYear();
      dateFrom = new Date(y, 0, 1);
      dateTo = new Date(y, 11, 31, 23, 59, 59, 999);
    }

    const breakdownFilter = { status: 'Completed', createdAt: { $gte: dateFrom, $lte: dateTo } };
    if (paymentMethod) breakdownFilter.paymentMethod = paymentMethod;

    const orders = await Order.find(breakdownFilter)
      .populate({
        path: 'items.variant',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'productType', select: 'name' },
          { path: 'color', select: 'name' },
        ],
        select: 'sku size category productType color',
      })
      .select('items createdAt paymentMethod');

    const rows = [];
    for (const order of orders) {
      for (const item of order.items) {
        const v = item.variant;
        if (category && v?.category?._id?.toString() !== category) continue;
        rows.push({
          date: order.createdAt,
          variantLabel: item.variantLabel,
          sku: v?.sku || '',
          qtySold: item.qty,
          costPrice: item.costPrice, // Actual batch cost (FIFO allocated)
          sellPrice: item.unitPrice,
          revenue: round2(item.lineFinal),
          profit: round2(item.lineFinal - item.costPrice * item.qty),
          paymentMethod: order.paymentMethod || 'BankTransfer',
        });
      }
    }

    const total = rows.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const data = rows.slice(skip, skip + parseInt(limit));

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

const getTopSelling = async (req, res, next) => {
  try {
    const { limit = 5, period, month } = req.query;

    let dateFilter = {};
    if (period === 'monthly' && month) {
      const [y, m] = month.split('-').map(Number);
      dateFilter = {
        createdAt: {
          $gte: new Date(y, m - 1, 1),
          $lte: new Date(y, m, 0, 23, 59, 59, 999),
        },
      };
    }

    const orders = await Order.find({ status: 'Completed', ...dateFilter }).select('items');

    const map = {};
    for (const order of orders) {
      for (const item of order.items) {
        const id = item.variant.toString();
        if (!map[id]) map[id] = { variantId: id, totalQtySold: 0, totalRevenue: 0 };
        map[id].totalQtySold += item.qty;
        map[id].totalRevenue += item.lineFinal;
      }
    }

    const sorted = Object.values(map)
      .sort((a, b) => b.totalQtySold - a.totalQtySold)
      .slice(0, parseInt(limit));

    const Variant = require('../models/Variant');
    const populated = await Promise.all(
      sorted.map(async (item) => {
        const variant = await Variant.findById(item.variantId)
          .populate('category', 'name')
          .populate('productType', 'name')
          .populate('color', 'name hexCode')
          .select('-__v');
        return { variant, totalQtySold: item.totalQtySold, totalRevenue: round2(item.totalRevenue) };
      })
    );

    return success(res, { data: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getBreakdown, getTopSelling };
