const Order = require('../models/Order');
const Variant = require('../models/Variant');
const StockMovement = require('../models/StockMovement');
const CouponCode = require('../models/CouponCode');
const generateOrderRef = require('../utils/generateOrderRef');
const { success, error } = require('../utils/apiResponse');

const round2 = (n) => Math.round(n * 100) / 100;

const POPULATE_ITEMS = {
  path: 'items.variant',
  populate: [
    { path: 'category', select: 'name' },
    { path: 'productType', select: 'name' },
    { path: 'color', select: 'name hexCode' },
  ],
  select: 'sku size images',
};

const getAll = async (req, res, next) => {
  try {
    const { status, couponApplied, dateFrom, dateTo, search, page = 1, limit = 25 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (couponApplied === 'true') filter.couponCode = { $ne: '' };
    if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }
    if (search) {
      filter.$or = [
        { orderRef: new RegExp(search, 'i') },
        { customerName: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Order.find(filter)
        .populate(POPULATE_ITEMS)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter),
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

const getOne = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate(POPULATE_ITEMS)
      .populate('coupon', 'code type value')
      .select('-__v');
    if (!order) return error(res, 'Order not found', 404);
    return success(res, { data: order });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      customerSecondaryPhone,
      items: rawItems,
      couponCode,
      manualDiscount = 0,
      manualDiscountType = null,
      notes,
      paymentMethod = 'BankTransfer',
      deliveryFee = 0,
    } = req.body;

    if (!rawItems || rawItems.length === 0) {
      return error(res, 'Order must contain at least one item', 400);
    }
    if (!customerAddress || !String(customerAddress).trim()) {
      return error(res, 'Customer address is required', 400);
    }

    // --- Step 1 & 2: Validate all items and build line data ---
    const lineItems = [];
    for (const raw of rawItems) {
      const variant = await Variant.findById(raw.variantId)
        .populate('category', 'name')
        .populate('productType', 'name')
        .populate('color', 'name');
      if (!variant) return error(res, `Variant ${raw.variantId} not found`, 404);
      if (!variant.isActive) return error(res, `Variant ${variant.sku} is inactive`, 400);
      if (variant.stockQty < raw.qty) {
        return error(
          res,
          `Insufficient stock for ${variant.sku}. Available: ${variant.stockQty}, Requested: ${raw.qty}`,
          400
        );
      }

      const lineTotal = round2(raw.qty * variant.sellPrice);
      let discountAmount = 0;
      if (raw.discountType === 'percent' && raw.discount > 0) {
        discountAmount = round2((lineTotal * raw.discount) / 100);
      } else if (raw.discountType === 'fixed' && raw.discount > 0) {
        discountAmount = Math.min(raw.discount, lineTotal);
      }
      const lineFinal = round2(lineTotal - discountAmount);

      const label = [
        variant.category?.name,
        variant.productType?.name,
        variant.size !== 'N/A' ? variant.size : null,
        variant.color?.name,
      ]
        .filter(Boolean)
        .join(' | ');

      lineItems.push({
        variant: variant._id,
        variantLabel: label,
        qty: raw.qty,
        unitPrice: variant.sellPrice,
        costPrice: variant.costPrice,
        lineTotal,
        discountType: raw.discountType || null,
        discount: raw.discount || 0,
        discountAmount,
        lineFinal,
        _stockQty: variant.stockQty, // temp field, not saved
        _variant: variant, // temp field for FIFO sellPrice fallback
      });
    }

    // --- Step 2.5: FIFO Batch Allocation ---
    // For each item, allocate from oldest batch first (FIFO)
    for (const item of lineItems) {
      // Get all 'IN' movements for this variant with available qty, ordered by creation (FIFO)
      const batches = await StockMovement.find({
        variant: item.variant,
        type: 'IN',
        qtyRemaining: { $gt: 0 }
      }).sort({ createdAt: 1 }); // Oldest first

      if (!batches || batches.length === 0) {
        return error(res, `No stock batches available for variant`, 400);
      }

      let remainingQty = item.qty;
      let primaryBatch = null;
      let totalCostAccumulator = 0;  // sum of (allocatedQty * costPrice) across all batches
      let totalSellAccumulator = 0;  // sum of (allocatedQty * sellPrice) across all batches
      let totalAllocated = 0;
      const allocations = []; // Track all batch allocations for reversal

      // Allocate from batches in FIFO order
      for (const batch of batches) {
        if (remainingQty <= 0) break;

        const allocateQty = Math.min(remainingQty, batch.qtyRemaining);

        if (!primaryBatch) {
          // First batch used — store reference for traceability
          primaryBatch = {
            batchId: batch._id,
            costPrice: batch.costPrice
          };
        }

        allocations.push({ batchId: batch._id, qty: allocateQty });

        // Accumulate weighted cost and sell price across all batches used
        totalCostAccumulator += allocateQty * (batch.costPrice || 0);
        totalSellAccumulator += allocateQty * (batch.sellPrice ?? item._variant.sellPrice ?? 0);
        totalAllocated += allocateQty;

        // Decrement batch qtyRemaining
        await StockMovement.findByIdAndUpdate(
          batch._id,
          { $inc: { qtyRemaining: -allocateQty } }
        );

        remainingQty -= allocateQty;
      }

      if (remainingQty > 0) {
        return error(res, `Insufficient stock for variant`, 400);
      }

      // Weighted averages across all FIFO batches consumed for this item
      const weightedAvgCost = totalAllocated > 0
        ? round2(totalCostAccumulator / totalAllocated)
        : (primaryBatch?.costPrice || 0);
      const weightedAvgSell = totalAllocated > 0
        ? round2(totalSellAccumulator / totalAllocated)
        : (item._variant.sellPrice || 0);

      // Store batch info in item for accurate P&L
      item.batchAllocations = allocations;
      item.batchSourceMovementId = primaryBatch.batchId;
      item.batchCostPrice = weightedAvgCost;
      item.costPrice = weightedAvgCost;
      item.batchSellPrice = weightedAvgSell;
      item.unitPrice = weightedAvgSell;

      // Recalculate line totals with FIFO sell price
      item.lineTotal = round2(item.qty * item.unitPrice);
      if (item.discountType === 'percent' && item.discount > 0) {
        item.discountAmount = round2((item.lineTotal * item.discount) / 100);
      } else if (item.discountType === 'fixed' && item.discount > 0) {
        item.discountAmount = Math.min(item.discount, item.lineTotal);
      } else {
        item.discountAmount = 0;
      }
      item.lineFinal = round2(item.lineTotal - item.discountAmount);
    }

    // --- Steps 3 & 4: Subtotals ---
    const subtotal = round2(lineItems.reduce((s, l) => s + l.lineTotal, 0));
    const itemDiscountAmount = round2(lineItems.reduce((s, l) => s + l.discountAmount, 0));

    // --- Step 5: Coupon ---
    let couponDiscountAmount = 0;
    let couponDoc = null;
    let resolvedCouponCode = '';
    if (couponCode && couponCode.trim()) {
      couponDoc = await CouponCode.findOne({ code: couponCode.toUpperCase() });
      if (!couponDoc) return error(res, 'Coupon not found', 400);
      if (!couponDoc.isActive) return error(res, 'Coupon is inactive', 400);
      if (couponDoc.expiryDate && new Date() > new Date(couponDoc.expiryDate)) {
        return error(res, 'Coupon has expired', 400);
      }
      if (couponDoc.usageLimit !== null && couponDoc.usedCount >= couponDoc.usageLimit) {
        return error(res, 'Coupon usage limit reached', 400);
      }
      // minOrderValue checked against gross subtotal (matching frontend behaviour)
      if (couponDoc.minOrderValue !== null && subtotal < couponDoc.minOrderValue) {
        return error(res, `Minimum order value of £${couponDoc.minOrderValue} required`, 400);
      }
      const base = round2(subtotal - itemDiscountAmount);
      couponDiscountAmount =
        couponDoc.type === 'percent'
          ? round2((base * couponDoc.value) / 100)
          : couponDoc.value;
      resolvedCouponCode = couponDoc.code;
    }

    // --- Step 6: Manual discount ---
    let resolvedManualDiscountAmount = 0;
    if (manualDiscount > 0) {
      const base = round2(subtotal - itemDiscountAmount - couponDiscountAmount);
      resolvedManualDiscountAmount =
        manualDiscountType === 'percent'
          ? round2((base * manualDiscount) / 100)
          : Math.min(manualDiscount, base);
    }

    // --- Step 7: Total ---
    const total = Math.max(
      0,
      round2(subtotal - itemDiscountAmount - couponDiscountAmount - resolvedManualDiscountAmount)
    );

    // --- Step 8: Generate order ref ---
    const orderRef = await generateOrderRef();

    // --- Step 9: Save order ---
    const orderItems = lineItems.map(({ _stockQty, _variant, ...item }) => item);
    const order = await Order.create({
      orderRef,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      customerAddress: String(customerAddress).trim(),
      customerSecondaryPhone: customerSecondaryPhone || '',
      items: orderItems,
      subtotal,
      itemDiscountAmount,
      coupon: couponDoc ? couponDoc._id : null,
      couponCode: resolvedCouponCode,
      discountAmount: couponDiscountAmount,
      manualDiscountType: manualDiscountType || null,
      manualDiscount,
      manualDiscountAmount: resolvedManualDiscountAmount,
      total,
      paymentMethod,
      deliveryFee,
      notes: notes || '',
    });

    // --- Steps 10 & 11: Deduct stock + create OUT movements ---
    for (const item of lineItems) {
      const variantDoc = await Variant.findById(item.variant);
      const qtyBefore = variantDoc.stockQty;
      const qtyAfter = qtyBefore - item.qty;
      await Variant.findByIdAndUpdate(item.variant, { $inc: { stockQty: -item.qty } });
      await StockMovement.create({
        variant: item.variant,
        type: 'OUT',
        qty: item.qty,
        qtyBefore,
        qtyAfter,
        reason: 'Order',
        orderId: order._id,
      });
    }

    // --- Step 12: Increment coupon usage ---
    if (couponDoc) {
      await CouponCode.findByIdAndUpdate(couponDoc._id, { $inc: { usedCount: 1 } });
    }

    // Return populated order
    const populated = await Order.findById(order._id)
      .populate(POPULATE_ITEMS)
      .select('-__v');

    return success(res, { data: populated }, 'Order created', 201);
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return error(res, 'Order not found', 404);
    if (order.status !== 'Pending') {
      return error(res, 'Only Pending orders can be cancelled', 400);
    }

    // Restore stock for each item
    for (const item of order.items) {
      const variant = await Variant.findById(item.variant);
      if (!variant) continue;
      const qtyBefore = variant.stockQty;
      const qtyAfter = qtyBefore + item.qty;
      await Variant.findByIdAndUpdate(item.variant, { $inc: { stockQty: item.qty } });
      await StockMovement.create({
        variant: item.variant,
        type: 'ADJUST',
        adjustDirection: 'add',
        qty: item.qty,
        qtyBefore,
        qtyAfter,
        reason: 'Order cancelled',
        orderId: order._id,
      });
    }

    // Decrement coupon usage if applicable
    if (order.coupon) {
      await CouponCode.findByIdAndUpdate(order.coupon, { $inc: { usedCount: -1 } });
    }

    order.status = 'Cancelled';
    await order.save();

    return success(res, { data: order }, 'Order cancelled');
  } catch (err) {
    next(err);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return error(res, 'Order not found', 404);
    if (order.status === 'Deleted') {
      return error(res, 'Order already deleted', 400);
    }

    const needsStockRestore = order.status === 'Completed' || order.status === 'Pending';

    for (const item of order.items) {
      // Restore FIFO batch qtyRemaining (for all statuses — fixes cancel bug too)
      if (item.batchAllocations && item.batchAllocations.length > 0) {
        for (const alloc of item.batchAllocations) {
          await StockMovement.findByIdAndUpdate(
            alloc.batchId,
            { $inc: { qtyRemaining: alloc.qty } }
          );
        }
      } else if (item.batchSourceMovementId) {
        // Legacy fallback: restore full qty to primary batch
        await StockMovement.findByIdAndUpdate(
          item.batchSourceMovementId,
          { $inc: { qtyRemaining: item.qty } }
        );
      }

      // Restore variant stock + create ADJUST movement (only if not already done by cancel)
      if (needsStockRestore) {
        const variant = await Variant.findById(item.variant);
        if (!variant) continue;
        const qtyBefore = variant.stockQty;
        const qtyAfter = qtyBefore + item.qty;
        await Variant.findByIdAndUpdate(item.variant, { $inc: { stockQty: item.qty } });
        await StockMovement.create({
          variant: item.variant,
          type: 'ADJUST',
          adjustDirection: 'add',
          qty: item.qty,
          qtyBefore,
          qtyAfter,
          reason: 'Order deleted',
          orderId: order._id,
        });
      }
    }

    // Restore coupon usage (only if not already done by cancel)
    if (needsStockRestore && order.coupon) {
      await CouponCode.findByIdAndUpdate(order.coupon, { $inc: { usedCount: -1 } });
    }

    order.status = 'Deleted';
    await order.save();

    return success(res, { data: order }, 'Order deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, cancel, deleteOrder };
