const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    variantLabel: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    costPrice: { type: Number, default: 0 }, // snapshot at order time for finance P&L
    lineTotal: { type: Number, required: true }, // qty × unitPrice (gross)
    // Tier 1: Per-item discount
    discountType: { type: String, enum: ['percent', 'fixed', null], default: null },
    discount: { type: Number, default: 0 },       // value entered
    discountAmount: { type: Number, default: 0 }, // calculated Rs. amount
    lineFinal: { type: Number, required: true },  // lineTotal - discountAmount
    // FIFO batch tracking
    batchSourceMovementId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockMovement', default: null }, // Which batch this came from
    batchCostPrice: { type: Number, default: null }, // Cost price from that specific batch
    batchSellPrice: { type: Number, default: null }, // Sell price from FIFO batch allocation
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderRef: { type: String, required: true, unique: true },
    customerName: { type: String, default: 'Walk-in Customer' },
    customerPhone: { type: String, default: '' },
    items: { type: [orderItemSchema], required: true },

    subtotal: { type: Number, required: true },          // sum of lineTotals (gross)
    itemDiscountAmount: { type: Number, default: 0 },    // Tier 1: sum of per-item discounts

    // Tier 2: Coupon discount
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'CouponCode', default: null },
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },        // coupon discount amount

    // Tier 3: Manual discount
    manualDiscountType: { type: String, enum: ['percent', 'fixed', null], default: null },
    manualDiscount: { type: Number, default: 0 },        // raw value entered
    manualDiscountAmount: { type: Number, default: 0 },  // calculated amount

    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Completed',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
