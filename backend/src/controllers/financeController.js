const Order = require('../models/Order');
const ManualFinanceEntry = require('../models/ManualFinanceEntry');
const { success, error } = require('../utils/apiResponse');
const { getResolvedGeneralSettings } = require('../services/generalSettingsService');
const { dayjs, formatBusinessBucketLabel, resolveBusinessDateRange } = require('../utils/businessTime');

const round2 = (n) => Math.round(n * 100) / 100;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getSummary = async (req, res, next) => {
  try {
    const { period = 'monthly', year, month, paymentMethod, dateFrom: qDateFrom, dateTo: qDateTo } = req.query;
    const generalSettings = await getResolvedGeneralSettings();
    const businessTimezone = generalSettings.timezone;

    const { dateFrom, dateTo } = resolveBusinessDateRange({
      period,
      year,
      month,
      dateFrom: qDateFrom,
      dateTo: qDateTo,
      timezone: businessTimezone,
    });

    const filter = { status: 'Completed', createdAt: { $gte: dateFrom, $lte: dateTo } };
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const [orders, manualEntries] = await Promise.all([
      Order.find(filter).select('total items createdAt paymentMethod'),
      ManualFinanceEntry.find({ entryDate: { $gte: dateFrom, $lte: dateTo } }).select('type amount entryDate'),
    ]);

    let totalRevenue = 0;
    let totalCost = 0;
    let manualIncomeTotal = 0;
    let manualExpenseTotal = 0;

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
      const label = formatBusinessBucketLabel(order.createdAt, period, businessTimezone);
      if (!buckets[label]) buckets[label] = { revenue: 0, cost: 0 };
      buckets[label].revenue += order.total;
      buckets[label].cost += orderCost;
    }

    for (const entry of manualEntries) {
      const amount = round2(entry.amount);
      const label = formatBusinessBucketLabel(entry.entryDate, period, businessTimezone);
      if (!buckets[label]) buckets[label] = { revenue: 0, cost: 0 };

      if (entry.type === 'income') {
        totalRevenue += amount;
        manualIncomeTotal += amount;
        buckets[label].revenue += amount;
      } else {
        totalCost += amount;
        manualExpenseTotal += amount;
        buckets[label].cost += amount;
      }
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
      const baseMonth = month
        ? dayjs.tz(`${month}-01`, businessTimezone)
        : dayjs().tz(businessTimezone).startOf('month');
      const daysInMonth = baseMonth.daysInMonth();
      chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const label = String(i + 1);
        const b = buckets[label] || { revenue: 0, cost: 0 };
        return { label, revenue: round2(b.revenue), cost: round2(b.cost), profit: round2(b.revenue - b.cost) };
      });
    } else {
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
        manualIncomeTotal: round2(manualIncomeTotal),
        manualExpenseTotal: round2(manualExpenseTotal),
        manualEntryCount: manualEntries.length,
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
    const generalSettings = await getResolvedGeneralSettings();

    const { dateFrom, dateTo } = resolveBusinessDateRange({
      period,
      year,
      month,
      dateFrom: qDateFrom,
      dateTo: qDateTo,
      timezone: generalSettings.timezone,
    });

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

const getManualEntries = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, type, page = 1, limit = 25 } = req.query;
    const generalSettings = await getResolvedGeneralSettings();
    const filter = {};

    if (type) filter.type = type;
    if (dateFrom || dateTo) {
      const range = resolveBusinessDateRange({
        dateFrom: dateFrom || dateTo,
        dateTo: dateTo || dateFrom,
        timezone: generalSettings.timezone,
      });
      filter.entryDate = {};
      if (dateFrom) filter.entryDate.$gte = range.dateFrom;
      if (dateTo) filter.entryDate.$lte = range.dateTo;
    }

    const numericPage = parseInt(page, 10);
    const numericLimit = parseInt(limit, 10);
    const skip = (numericPage - 1) * numericLimit;

    const [data, total] = await Promise.all([
      ManualFinanceEntry.find(filter)
        .populate('createdBy', 'username')
        .select('-__v')
        .sort({ entryDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(numericLimit),
      ManualFinanceEntry.countDocuments(filter),
    ]);

    return success(res, {
      data,
      total,
      page: numericPage,
      totalPages: Math.ceil(total / numericLimit),
    });
  } catch (err) {
    next(err);
  }
};

const createManualEntry = async (req, res, next) => {
  try {
    const { type, amount, reason, entryDate } = req.body;
    const entry = await ManualFinanceEntry.create({
      type,
      amount: round2(Number(amount)),
      reason,
      entryDate,
      createdBy: req.user.id,
    });

    return success(res, { data: entry }, 'Manual finance entry created', 201);
  } catch (err) {
    next(err);
  }
};

const updateManualEntry = async (req, res, next) => {
  try {
    const { type, amount, reason, entryDate } = req.body;
    const entry = await ManualFinanceEntry.findById(req.params.id);
    if (!entry) return error(res, 'Manual finance entry not found', 404);

    entry.type = type;
    entry.amount = round2(Number(amount));
    entry.reason = reason;
    entry.entryDate = entryDate;
    await entry.save();

    return success(res, { data: entry }, 'Manual finance entry updated');
  } catch (err) {
    next(err);
  }
};

const deleteManualEntry = async (req, res, next) => {
  try {
    const entry = await ManualFinanceEntry.findById(req.params.id);
    if (!entry) return error(res, 'Manual finance entry not found', 404);

    await entry.deleteOne();
    return success(res, {}, 'Manual finance entry deleted');
  } catch (err) {
    next(err);
  }
};

const getTopSelling = async (req, res, next) => {
  try {
    const { limit = 5, period, month } = req.query;
    const generalSettings = await getResolvedGeneralSettings();

    let dateFilter = {};
    if (period === 'monthly' && month) {
      const { dateFrom, dateTo } = resolveBusinessDateRange({
        period: 'daily',
        month,
        timezone: generalSettings.timezone,
      });
      dateFilter = {
        createdAt: {
          $gte: dateFrom,
          $lte: dateTo,
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

module.exports = {
  getSummary,
  getBreakdown,
  getTopSelling,
  getManualEntries,
  createManualEntry,
  updateManualEntry,
  deleteManualEntry,
};
