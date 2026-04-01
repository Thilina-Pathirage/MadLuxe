const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { success, error } = require('../utils/apiResponse');

const POPULATE_ITEMS = {
  path: 'items.variant',
  populate: [
    { path: 'category', select: 'name' },
    { path: 'productType', select: 'name' },
    { path: 'color', select: 'name hexCode' },
  ],
  select: 'sku size images weightGrams',
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildOrderFilters = (query, customerId) => {
  const { status, couponApplied, dateFrom, dateTo, search, paymentMethod } = query;
  const filter = { customer: customerId };

  if (status) filter.status = status;
  if (couponApplied === 'true') filter.couponCode = { $ne: '' };
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  if (search && String(search).trim()) {
    const searchRegex = new RegExp(escapeRegExp(String(search).trim()), 'i');
    filter.$or = [
      { orderRef: searchRegex },
      { customerName: searchRegex },
      { customerPhone: searchRegex },
    ];
  }

  return filter;
};

const getAllCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;
    const search = String(req.query.search || '').trim();

    const filter = {};
    if (search) {
      const searchRegex = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .select('name email phone createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    const customerIds = customers.map((customer) => customer._id);
    const orderCounts = customerIds.length
      ? await Order.aggregate([
          { $match: { customer: { $in: customerIds } } },
          { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
        ])
      : [];

    const orderCountMap = new Map(orderCounts.map((row) => [String(row._id), row.orderCount]));

    const data = customers.map((customer) => ({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      orderCount: orderCountMap.get(String(customer._id)) || 0,
    }));

    return success(res, {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

const getCustomerOrders = async (req, res, next) => {
  try {
    const customerId = String(req.params.id || '');
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return error(res, 'Invalid customer id', 400);
    }

    const customer = await Customer.findById(customerId).select('name email phone createdAt').lean();
    if (!customer) {
      return error(res, 'Customer not found', 404);
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;
    const filter = buildOrderFilters(req.query, customer._id);

    const [data, total] = await Promise.all([
      Order.find(filter)
        .populate(POPULATE_ITEMS)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return success(res, {
      customer,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerOrders,
};
