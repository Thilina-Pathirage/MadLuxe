const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    type: { type: String, enum: ['IN', 'OUT', 'ADJUST'], required: true },
    adjustDirection: { type: String, enum: ['add', 'reduce', null], default: null },
    qty: { type: Number, required: true, min: 1 },
    qtyBefore: { type: Number, required: true },
    qtyAfter: { type: Number, required: true },
    costPrice: { type: Number, default: null },
    sellPrice: { type: Number, default: null },
    reason: { type: String, default: '' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    supplier: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: String, default: 'Admin' },
    qtyRemaining: { type: Number, default: null }, // For 'IN' movements: tracks remaining qty in batch for FIFO
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockMovement', stockMovementSchema);
