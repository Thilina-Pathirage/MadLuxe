require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const Category = require('../models/Category');
const ProductType = require('../models/ProductType');
const Color = require('../models/Color');
const Variant = require('../models/Variant');
const StockMovement = require('../models/StockMovement');
const Order = require('../models/Order');
const CouponCode = require('../models/CouponCode');

async function wipe() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  console.log('\nWiping all collections (admin user preserved)...');
  await CouponCode.deleteMany({});
  await Order.deleteMany({});
  await StockMovement.deleteMany({});
  await Variant.deleteMany({});
  await Color.deleteMany({});
  await ProductType.deleteMany({});
  await Category.deleteMany({});
  console.log('✅ Done — all data wiped, admin user intact.');

  await mongoose.disconnect();
  process.exit(0);
}

wipe().catch((err) => {
  console.error(err);
  process.exit(1);
});
