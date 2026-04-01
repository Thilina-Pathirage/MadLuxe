const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Variant = require('../models/Variant');
const StockMovement = require('../models/StockMovement');
const Customer = require('../models/Customer');
const generateOrderRef = require('../utils/generateOrderRef');
const { success, error } = require('../utils/apiResponse');
const { getResolvedGeneralSettings } = require('../services/generalSettingsService');
const { calculateDeliveryFee } = require('../utils/deliveryPricing');

const signCustomerToken = (id) =>
  jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const round2 = (n) => Math.round(n * 100) / 100;

const POPULATE_ITEMS = {
  path: 'items.variant',
  populate: [
    { path: 'category', select: 'name' },
    { path: 'productType', select: 'name' },
    { path: 'color', select: 'name hexCode' },
  ],
  select: 'sku size images weightGrams',
};

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

const buildVariantLabel = (variant) => {
  const parts = [
    variant.category?.name,
    variant.productType?.name,
    variant.size !== 'N/A' ? variant.size : null,
    variant.color?.name,
  ].filter(Boolean);

  return parts.join(' | ') || variant.sku || 'Variant';
};

const rollbackBatchDecrements = async (decrements) => {
  if (!decrements.length) return;

  await Promise.all(
    decrements.map((entry) =>
      StockMovement.findByIdAndUpdate(entry.batchId, { $inc: { qtyRemaining: entry.qty } })
    )
  );
};

const rollbackVariantDecrements = async (decrements) => {
  if (!decrements.length) return;

  await Promise.all(
    decrements.map((entry) =>
      Variant.findByIdAndUpdate(entry.variantId, { $inc: { stockQty: entry.qty } })
    )
  );
};

const normalizeItems = (rawItems = []) => {
  const map = new Map();

  for (const raw of rawItems) {
    const variantId = String(raw?.variantId || '').trim();
    const batchId = String(raw?.batchId || '').trim();
    const qty = Number(raw?.qty || 0);

    if (!variantId || !batchId || !Number.isInteger(qty) || qty < 1) {
      return { errorMessage: 'Each item must include a valid variantId, batchId and quantity >= 1' };
    }
    if (!isMongoId(variantId) || !isMongoId(batchId)) {
      return { errorMessage: 'Items must include valid Mongo IDs for variantId and batchId' };
    }

    const key = `${variantId}:${batchId}`;
    const existing = map.get(key);
    if (existing) {
      existing.qty += qty;
      continue;
    }

    map.set(key, { variantId, batchId, qty });
  }

  return { items: Array.from(map.values()) };
};

const createPublicOrder = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      customerProvince,
      customerDistrict,
      customerCity,
      paymentMethod,
      items: rawItems,
      createAccount,
    } = req.body;

    const resolvedName = String(customerName || '').trim();
    const resolvedPhone = String(customerPhone || '').trim();
    const resolvedAddress = String(customerAddress || '').trim();
    const resolvedProvince = String(customerProvince || '').trim();
    const resolvedDistrict = String(customerDistrict || '').trim();
    const resolvedCity = String(customerCity || '').trim();

    if (!resolvedName) return error(res, 'Customer name is required', 400);
    if (!resolvedPhone) return error(res, 'Customer phone number is required', 400);
    if (!resolvedAddress) return error(res, 'Customer address is required', 400);
    if (!resolvedProvince) return error(res, 'Customer province is required', 400);
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return error(res, 'Order must contain at least one item', 400);
    }

    const resolvedPaymentMethod =
      paymentMethod === 'COD' || paymentMethod === 'BankTransfer' ? paymentMethod : null;
    if (!resolvedPaymentMethod) {
      return error(res, 'Payment method must be COD or BankTransfer', 400);
    }

    const settings = await getResolvedGeneralSettings();

    const normalized = normalizeItems(rawItems);
    if (normalized.errorMessage) {
      return error(res, normalized.errorMessage, 400);
    }

    const lineItems = normalized.items;
    const batchIds = lineItems.map((item) => item.batchId);
    const variantIds = Array.from(new Set(lineItems.map((item) => item.variantId)));

    const [batches, variants] = await Promise.all([
      StockMovement.find({ _id: { $in: batchIds }, type: 'IN' })
        .select('_id variant qtyRemaining sellPrice costPrice'),
      Variant.find({ _id: { $in: variantIds }, isActive: true })
        .populate('category', 'name')
        .populate('productType', 'name')
        .populate('color', 'name')
        .select('sku category productType color size weightGrams sellPrice costPrice stockQty isActive'),
    ]);

    const batchMap = new Map(batches.map((batch) => [String(batch._id), batch]));
    const variantMap = new Map(variants.map((variant) => [String(variant._id), variant]));
    const variantDemand = new Map();

    for (const item of lineItems) {
      const batch = batchMap.get(item.batchId);
      if (!batch) {
        return error(res, `Selected batch ${item.batchId} is no longer available`, 400);
      }
      if (String(batch.variant) !== item.variantId) {
        return error(res, 'Selected batch does not belong to the requested product', 400);
      }
      if ((batch.qtyRemaining ?? 0) < item.qty) {
        return error(
          res,
          `Insufficient stock in selected batch. Available: ${batch.qtyRemaining ?? 0}, Requested: ${item.qty}`,
          400
        );
      }

      const variant = variantMap.get(item.variantId);
      if (!variant) {
        return error(res, 'One or more selected products are unavailable', 400);
      }

      const nextDemand = (variantDemand.get(item.variantId) || 0) + item.qty;
      variantDemand.set(item.variantId, nextDemand);
    }

    for (const [variantId, qtyNeeded] of variantDemand.entries()) {
      const variant = variantMap.get(variantId);
      if (!variant || !variant.isActive) {
        return error(res, 'One or more selected products are unavailable', 400);
      }
      if ((variant.stockQty ?? 0) < qtyNeeded) {
        return error(
          res,
          `Insufficient stock for ${variant.sku}. Available: ${variant.stockQty ?? 0}, Requested: ${qtyNeeded}`,
          400
        );
      }
    }

    const decrementedBatches = [];
    for (const item of lineItems) {
      const updated = await StockMovement.findOneAndUpdate(
        {
          _id: item.batchId,
          variant: item.variantId,
          type: 'IN',
          qtyRemaining: { $gte: item.qty },
        },
        { $inc: { qtyRemaining: -item.qty } },
        { new: true }
      );

      if (!updated) {
        await rollbackBatchDecrements(decrementedBatches);
        return error(res, 'Stock changed while placing this order. Please review your cart and try again.', 409);
      }

      decrementedBatches.push({ batchId: item.batchId, qty: item.qty });
    }

    const decrementedVariants = [];
    for (const [variantId, qtyNeeded] of variantDemand.entries()) {
      const updated = await Variant.findOneAndUpdate(
        {
          _id: variantId,
          isActive: true,
          stockQty: { $gte: qtyNeeded },
        },
        { $inc: { stockQty: -qtyNeeded } },
        { new: true }
      );

      if (!updated) {
        await rollbackVariantDecrements(decrementedVariants);
        await rollbackBatchDecrements(decrementedBatches);
        return error(res, 'Stock changed while placing this order. Please review your cart and try again.', 409);
      }

      decrementedVariants.push({ variantId, qty: qtyNeeded });
    }

    // Resolve customer — auto-link if logged in, otherwise attempt account creation
    let customerId = null;
    let newCustomerToken = null;

    if (req.customer) {
      // Already authenticated customer
      customerId = req.customer._id;
    } else if (createAccount && typeof createAccount === 'object') {
      const caEmail = String(createAccount.email || '').toLowerCase().trim();
      const caPassword = String(createAccount.password || '');
      if (caEmail && caPassword.length >= 6) {
        const existing = await Customer.findOne({ email: caEmail });
        if (!existing) {
          const newCustomer = await Customer.create({
            name: resolvedName,
            email: caEmail,
            password: caPassword,
            phone: resolvedPhone,
            address: resolvedAddress,
            province: resolvedProvince,
            district: resolvedDistrict,
            city: resolvedCity,
          });
          customerId = newCustomer._id;
          newCustomerToken = signCustomerToken(newCustomer._id);
        } else {
          // Email already taken — link order to existing account silently
          customerId = existing._id;
        }
      }
    }

    let createdOrder = null;

    try {
      const orderRef = await generateOrderRef();

      const orderItems = lineItems.map((item) => {
        const variant = variantMap.get(item.variantId);
        const batch = batchMap.get(item.batchId);
        const unitWeightGrams = Math.max(1, Math.round(Number(variant.weightGrams) || 1000));
        const lineWeightGrams = unitWeightGrams * item.qty;

        const unitPrice = Number(batch.sellPrice ?? variant.sellPrice ?? 0);
        const costPrice = Number(batch.costPrice ?? variant.costPrice ?? 0);
        const lineTotal = round2(item.qty * unitPrice);

        return {
          variant: variant._id,
          variantLabel: buildVariantLabel(variant),
          qty: item.qty,
          unitWeightGrams,
          lineWeightGrams,
          unitPrice,
          costPrice,
          lineTotal,
          discountType: null,
          discount: 0,
          discountAmount: 0,
          lineFinal: lineTotal,
          batchSourceMovementId: batch._id,
          batchCostPrice: costPrice,
          batchSellPrice: unitPrice,
          batchAllocations: [{ batchId: batch._id, qty: item.qty }],
        };
      });

      const subtotal = round2(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));
      const totalWeightGrams = orderItems.reduce((sum, item) => sum + item.lineWeightGrams, 0);
      const deliveryCalc = calculateDeliveryFee({
        province: resolvedProvince,
        totalWeightGrams,
        deliveryPricing: settings?.deliveryPricing,
        fallbackBaseFee: Number(settings?.defaultDeliveryFee ?? 300),
      });
      const resolvedDeliveryFee = round2(deliveryCalc.deliveryFee);
      const finalTotal = round2(subtotal + resolvedDeliveryFee);

      createdOrder = await Order.create({
        orderRef,
        customerName: resolvedName,
        customerPhone: resolvedPhone,
        customerAddress: resolvedAddress,
        customerProvince: resolvedProvince,
        customerDistrict: resolvedDistrict,
        customerCity: resolvedCity,
        customerSecondaryPhone: '',
        items: orderItems,
        subtotal,
        itemDiscountAmount: 0,
        coupon: null,
        couponCode: '',
        discountAmount: 0,
        manualDiscountType: null,
        manualDiscount: 0,
        manualDiscountAmount: 0,
        total: finalTotal,
        totalWeightGrams,
        paymentMethod: resolvedPaymentMethod,
        deliveryFee: resolvedDeliveryFee,
        status: 'Pending',
        notes: '',
        customer: customerId,
      });

      const runningVariantStock = new Map();
      for (const [variantId, variant] of variantMap.entries()) {
        runningVariantStock.set(variantId, Number(variant.stockQty || 0));
      }

      const outMovements = lineItems.map((item) => {
        const qtyBefore = Number(runningVariantStock.get(item.variantId) || 0);
        const qtyAfter = qtyBefore - item.qty;
        runningVariantStock.set(item.variantId, qtyAfter);

        return {
          variant: item.variantId,
          type: 'OUT',
          qty: item.qty,
          qtyBefore,
          qtyAfter,
          reason: 'Order',
          orderId: createdOrder._id,
        };
      });

      await StockMovement.insertMany(outMovements);
    } catch (err) {
      if (createdOrder?._id) {
        await Order.findByIdAndDelete(createdOrder._id).catch(() => {});
      }
      await rollbackVariantDecrements(decrementedVariants);
      await rollbackBatchDecrements(decrementedBatches);
      throw err;
    }

    const populated = await Order.findById(createdOrder._id)
      .populate(POPULATE_ITEMS)
      .select('-__v');

    const responsePayload = { data: populated };
    if (newCustomerToken) responsePayload.customerToken = newCustomerToken;

    return success(res, responsePayload, 'Order created', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { createPublicOrder };
