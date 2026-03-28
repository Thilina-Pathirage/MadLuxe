require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const Category = require('../models/Category');
const ProductType = require('../models/ProductType');
const Color = require('../models/Color');
const Variant = require('../models/Variant');
const StockMovement = require('../models/StockMovement');
const Order = require('../models/Order');
const CouponCode = require('../models/CouponCode');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ─── SEED DATA ─────────────────────────────────────────────────────────────

const COLORS_DATA = [
  { name: 'Pink',     hexCode: '#f48fb1' },
  { name: 'Blue',     hexCode: '#1976d2' },
  { name: 'White',    hexCode: '#f5f5f5' },
  { name: 'Grey',     hexCode: '#9e9e9e' },
  { name: 'Navy',     hexCode: '#1a237e' },
  { name: 'Green',    hexCode: '#388e3c' },
  { name: 'Cream',    hexCode: '#f5f0e8' },
  { name: 'Gold',     hexCode: '#f9a825' },
  { name: 'Red',      hexCode: '#c62828' },
  { name: 'Charcoal', hexCode: '#37474f' },
  { name: 'Beige',    hexCode: '#d7ccc8' },
  { name: 'Teal',     hexCode: '#00695c' },
  { name: 'Burgundy', hexCode: '#880e4f' },
  { name: 'Mustard',  hexCode: '#f57f17' },
  { name: 'Black',    hexCode: '#212121' },
];

const CATEGORIES_DATA = [
  { name: 'Bedsheets' },
  { name: 'Blankets' },
  { name: 'Sofa Pillow Covers' },
  { name: 'Table Runners' },
  { name: 'Table Cloths' },
];

// [categoryName, typeName, hasSizes, sizes[]]
const PRODUCT_TYPES_DATA = [
  ['Bedsheets',           'Stripe',            true,  ['Single', 'King', 'Superking']],
  ['Bedsheets',           'Egyptian Cotton',   true,  ['Single', 'King']],
  ['Blankets',            'Printed Checks',    false, ['N/A']],
  ['Blankets',            'Waffle',            false, ['N/A']],
  ['Blankets',            'Ribbed',            false, ['N/A']],
  ['Blankets',            'Pineapple Grid',    false, ['N/A']],
  ['Blankets',            'Ribbed Design',     false, ['N/A']],
  ['Blankets',            'Royal Type 1',      false, ['N/A']],
  ['Blankets',            'Royal Type 2',      false, ['N/A']],
  ['Blankets',            'Popcorn',           false, ['N/A']],
  ['Sofa Pillow Covers',  'Standard',          false, ['N/A']],
  ['Table Runners',       'Inside Colour Type',false, ['N/A']],
  ['Table Cloths',        'Inside Colour Type',false, ['N/A']],
];

// [numericId, sku, category, type, size, color, costPrice, sellPrice, stockQty, lowStockThreshold]
const VARIANTS_DATA = [
  // Bedsheets – Stripe
  [1,  'BS-STR-001', 'Bedsheets', 'Stripe',           'Single',    'White',    8.50,  16.99, 22, 5],
  [2,  'BS-STR-002', 'Bedsheets', 'Stripe',           'Single',    'Blue',     8.50,  16.99,  3, 5],
  [3,  'BS-STR-003', 'Bedsheets', 'Stripe',           'King',      'White',   11.00,  22.99, 14, 4],
  [4,  'BS-STR-004', 'Bedsheets', 'Stripe',           'King',      'Grey',    11.00,  22.99,  8, 4],
  [5,  'BS-STR-005', 'Bedsheets', 'Stripe',           'Superking', 'Navy',    14.00,  27.99,  0, 3],
  [6,  'BS-STR-006', 'Bedsheets', 'Stripe',           'Superking', 'Charcoal',14.00,  27.99,  2, 3],
  // Bedsheets – Egyptian Cotton
  [7,  'BS-EGY-001', 'Bedsheets', 'Egyptian Cotton',  'Single',    'Cream',   14.00,  29.99,  9, 5],
  [8,  'BS-EGY-002', 'Bedsheets', 'Egyptian Cotton',  'Single',    'White',   14.00,  29.99, 12, 5],
  [9,  'BS-EGY-003', 'Bedsheets', 'Egyptian Cotton',  'King',      'Cream',   18.00,  37.99,  4, 3],
  [10, 'BS-EGY-004', 'Bedsheets', 'Egyptian Cotton',  'King',      'Gold',    18.00,  37.99,  0, 3],
  // Blankets – Printed Checks
  [11, 'BL-CHK-001', 'Blankets',  'Printed Checks',   'N/A',       'Red',     12.00,  24.99, 17, 5],
  [12, 'BL-CHK-002', 'Blankets',  'Printed Checks',   'N/A',       'Navy',    12.00,  24.99,  5, 5],
  [13, 'BL-CHK-003', 'Blankets',  'Printed Checks',   'N/A',       'Grey',    12.00,  24.99,  8, 5],
  // Blankets – Waffle
  [14, 'BL-WFL-001', 'Blankets',  'Waffle',           'N/A',       'White',   10.00,  21.99, 20, 5],
  [15, 'BL-WFL-002', 'Blankets',  'Waffle',           'N/A',       'Beige',   10.00,  21.99, 11, 5],
  [16, 'BL-WFL-003', 'Blankets',  'Waffle',           'N/A',       'Grey',    10.00,  21.99,  2, 5],
  // Blankets – Ribbed
  [17, 'BL-RBD-001', 'Blankets',  'Ribbed',           'N/A',       'Cream',   11.00,  23.99, 15, 5],
  [18, 'BL-RBD-002', 'Blankets',  'Ribbed',           'N/A',       'Teal',    11.00,  23.99,  6, 5],
  [19, 'BL-RBD-003', 'Blankets',  'Ribbed',           'N/A',       'Mustard', 11.00,  23.99,  0, 3],
  // Blankets – Pineapple Grid
  [20, 'BL-PNG-001', 'Blankets',  'Pineapple Grid',   'N/A',       'White',   13.00,  26.99,  9, 5],
  [21, 'BL-PNG-002', 'Blankets',  'Pineapple Grid',   'N/A',       'Pink',    13.00,  26.99,  3, 4],
  [22, 'BL-PNG-003', 'Blankets',  'Pineapple Grid',   'N/A',       'Gold',    13.00,  26.99,  7, 4],
  // Blankets – Ribbed Design
  [23, 'BL-RDS-001', 'Blankets',  'Ribbed Design',    'N/A',       'Navy',    12.50,  25.99, 10, 5],
  [24, 'BL-RDS-002', 'Blankets',  'Ribbed Design',    'N/A',       'Charcoal',12.50,  25.99,  4, 4],
  [25, 'BL-RDS-003', 'Blankets',  'Ribbed Design',    'N/A',       'Burgundy',12.50,  25.99,  8, 4],
  // Blankets – Royal Type 1
  [26, 'BL-RY1-001', 'Blankets',  'Royal Type 1',     'N/A',       'Gold',    18.00,  36.99,  6, 3],
  [27, 'BL-RY1-002', 'Blankets',  'Royal Type 1',     'N/A',       'Cream',   18.00,  36.99,  2, 3],
  [28, 'BL-RY1-003', 'Blankets',  'Royal Type 1',     'N/A',       'Burgundy',18.00,  36.99,  4, 3],
  // Blankets – Royal Type 2
  [29, 'BL-RY2-001', 'Blankets',  'Royal Type 2',     'N/A',       'Blue',    19.00,  38.99,  5, 3],
  [30, 'BL-RY2-002', 'Blankets',  'Royal Type 2',     'N/A',       'Gold',    19.00,  38.99,  1, 3],
  // Blankets – Popcorn
  [31, 'BL-POP-001', 'Blankets',  'Popcorn',          'N/A',       'White',    9.00,  19.99, 25, 6],
  [32, 'BL-POP-002', 'Blankets',  'Popcorn',          'N/A',       'Pink',     9.00,  19.99, 13, 5],
  [33, 'BL-POP-003', 'Blankets',  'Popcorn',          'N/A',       'Grey',     9.00,  19.99,  7, 5],
  // Sofa Pillow Covers
  [34, 'SPC-STD-001','Sofa Pillow Covers','Standard',  'N/A',       'Navy',     4.00,   8.99, 18, 8],
  [35, 'SPC-STD-002','Sofa Pillow Covers','Standard',  'N/A',       'Grey',     4.00,   8.99, 10, 8],
  [36, 'SPC-STD-003','Sofa Pillow Covers','Standard',  'N/A',       'Cream',    4.00,   8.99,  6, 8],
  [37, 'SPC-STD-004','Sofa Pillow Covers','Standard',  'N/A',       'Teal',     4.00,   8.99,  3, 5],
  [38, 'SPC-STD-005','Sofa Pillow Covers','Standard',  'N/A',       'Mustard',  4.00,   8.99,  0, 5],
  [39, 'SPC-STD-006','Sofa Pillow Covers','Standard',  'N/A',       'Burgundy', 4.00,   8.99, 14, 5],
  // Table Runners
  [40, 'TR-ICT-001', 'Table Runners','Inside Colour Type','N/A',   'Gold',     5.50,  11.99, 20, 6],
  [41, 'TR-ICT-002', 'Table Runners','Inside Colour Type','N/A',   'Red',      5.50,  11.99, 12, 6],
  [42, 'TR-ICT-003', 'Table Runners','Inside Colour Type','N/A',   'Green',    5.50,  11.99,  4, 5],
  [43, 'TR-ICT-004', 'Table Runners','Inside Colour Type','N/A',   'Navy',     5.50,  11.99,  8, 5],
  [44, 'TR-ICT-005', 'Table Runners','Inside Colour Type','N/A',   'White',    5.50,  11.99, 16, 5],
  // Table Cloths
  [45, 'TC-ICT-001', 'Table Cloths','Inside Colour Type','N/A',    'White',    7.00,  14.99, 15, 5],
  [46, 'TC-ICT-002', 'Table Cloths','Inside Colour Type','N/A',    'Cream',    7.00,  14.99,  9, 5],
  [47, 'TC-ICT-003', 'Table Cloths','Inside Colour Type','N/A',    'Navy',     7.00,  14.99,  2, 4],
  [48, 'TC-ICT-004', 'Table Cloths','Inside Colour Type','N/A',    'Red',      7.00,  14.99,  0, 4],
  [49, 'TC-ICT-005', 'Table Cloths','Inside Colour Type','N/A',    'Gold',     7.00,  14.99, 11, 4],
];

const COUPONS_DATA = [
  { code: 'SUMMER10',  type: 'percent', value: 10, minOrderValue: 20,   expiryDate: new Date('2026-08-31'), usageLimit: 50,   usedCount: 14, isActive: true },
  { code: 'FLAT5',     type: 'fixed',   value: 5,  minOrderValue: 30,   expiryDate: null,                   usageLimit: null, usedCount: 9,  isActive: true },
  { code: 'WELCOME15', type: 'percent', value: 15, minOrderValue: null, expiryDate: new Date('2026-12-31'), usageLimit: 10,   usedCount: 3,  isActive: true },
  { code: 'VIP20',     type: 'percent', value: 20, minOrderValue: 50,   expiryDate: new Date('2026-06-30'), usageLimit: 20,   usedCount: 5,  isActive: true },
  { code: 'NEWUSER',   type: 'fixed',   value: 3,  minOrderValue: null, expiryDate: new Date('2025-12-31'), usageLimit: 100,  usedCount: 42, isActive: false },
];

// Orders seed: [orderRef, customerName, phone, couponCode, subtotal, discountAmount, total, status, createdAt, items[], paymentMethod, deliveryFee]
// items: [numericVariantId, qty, unitPrice, lineTotal]
const ORDERS_DATA = [
  ['ORD-001','Sarah Bennett', '07700900001', null,        55.97,  0,    55.97, 'Completed', '2026-03-06', [[1,2,16.99,33.98],[3,1,22.99,22.99]],              'BankTransfer', 0],
  ['ORD-002','James O\'Brien','07700900002', 'SUMMER10',  74.97,  7.50, 67.47, 'Completed', '2026-03-07', [[11,3,24.99,74.97]],                                'COD',          350],
  ['ORD-003','Priya Sharma',  '07700900003', null,        97.94,  0,    97.94, 'Completed', '2026-03-08', [[31,4,19.99,79.96],[34,2,8.99,17.98]],              'COD',          350],
  ['ORD-004','Ahmed Hassan',  '07700900004', 'FLAT5',     41.98,  5,    36.98, 'Completed', '2026-03-09', [[40,1,11.99,11.99],[7,1,29.99,29.99]],              'BankTransfer', 0],
  ['ORD-005','Emma Williams', '07700900005', null,        98.93,  0,    98.93, 'Completed', '2026-03-10', [[20,2,26.99,53.98],[45,3,14.99,44.97]],             'COD',          350],
  ['ORD-006','Tom Fletcher',  '07700900006', 'WELCOME15', 76.96, 11.54, 65.42,'Completed', '2026-03-14', [[1,1,16.99,16.99],[32,3,19.99,59.97]],              'BankTransfer', 0],
  ['ORD-007','Chloe Martin',  '07700900007', null,        38.97,  0,    38.97, 'Completed', '2026-03-15', [[41,2,11.99,23.98],[46,1,14.99,14.99]],             'COD',          350],
  ['ORD-008','Daniel Park',   '07700900008', null,        59.98,  0,    59.98, 'Completed', '2026-03-16', [[8,2,29.99,59.98]],                                  'BankTransfer', 0],
  ['ORD-009','Fatima Al-Zahra','07700900009','SUMMER10',  55.97,  5.60, 50.37, 'Completed', '2026-03-18', [[1,2,16.99,33.98],[15,1,21.99,21.99]],              'COD',          350],
  ['ORD-010','George Hughes', '07700900010', null,       111.95,  0,   111.95, 'Completed', '2026-03-19', [[23,2,25.99,51.98],[33,3,19.99,59.97]],             'BankTransfer', 0],
  ['ORD-011','Isabella Turner','07700900011',null,         32.97,  0,    32.97, 'Pending',   '2026-03-20', [[44,2,11.99,23.98],[35,1,8.99,8.99]],              'COD',          350],
  ['ORD-012','Lucas Green',   '07700900012', null,        74.98,  0,    74.98, 'Pending',   '2026-03-21', [[26,1,36.99,36.99],[9,1,37.99,37.99]],              'BankTransfer', 0],
  ['ORD-013','Maya Patel',    '07700900013', null,        41.97,  0,    41.97, 'Completed', '2026-03-22', [[47,2,14.99,29.98],[43,1,11.99,11.99]],             'COD',          350],
  ['ORD-014','Noah Baker',    '07700900014', null,        38.99,  0,    38.99, 'Cancelled', '2026-03-22', [[29,1,38.99,38.99]],                                 'BankTransfer', 0],
  ['ORD-015','Olivia Scott',  '07700900015', 'FLAT5',    108.95,  5,   103.95, 'Pending',   '2026-03-23', [[3,3,22.99,68.97],[32,2,19.99,39.98]],              'COD',          350],
];

// ─── SEED RUNNER ──────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Admin user (upsert — never delete) ──
  console.log('\nSeeding admin user...');
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  await User.findOneAndUpdate(
    { username: process.env.ADMIN_USERNAME.toLowerCase() },
    { username: process.env.ADMIN_USERNAME.toLowerCase(), password: hashedPassword, role: 'admin' },
    { upsert: true, new: true }
  );
  console.log('✓ Admin user seeded');

  // ── Clear all (reverse dependency order) ──
  console.log('\nClearing existing data...');
  await CouponCode.deleteMany({});
  await Order.deleteMany({});
  await StockMovement.deleteMany({});
  await Variant.deleteMany({});
  await Color.deleteMany({});
  await ProductType.deleteMany({});
  await Category.deleteMany({});
  console.log('✓ All collections cleared');

  // ── 1. Colors ──
  console.log('\nSeeding colors...');
  const colors = await Color.insertMany(COLORS_DATA);
  const colorMap = {};
  colors.forEach((c) => { colorMap[c.name] = c._id; });
  console.log(`✓ ${colors.length} colors seeded`);

  // ── 2. Categories ──
  console.log('Seeding categories...');
  const categories = await Category.insertMany(CATEGORIES_DATA);
  const categoryMap = {};
  categories.forEach((c) => { categoryMap[c.name] = c._id; });
  console.log(`✓ ${categories.length} categories seeded`);

  // ── 3. ProductTypes ──
  console.log('Seeding product types...');
  const ptDocs = PRODUCT_TYPES_DATA.map(([catName, name, hasSizes, sizes]) => ({
    category: categoryMap[catName],
    name,
    hasSizes,
    sizes,
  }));
  const productTypes = await ProductType.insertMany(ptDocs);
  const productTypeMap = {};
  productTypes.forEach((pt) => { productTypeMap[`${pt.category}_${pt.name}`] = pt._id; });
  // Also create a simple name→id map per category
  const ptByName = {};
  productTypes.forEach((pt) => { ptByName[pt.name] = pt._id; });
  console.log(`✓ ${productTypes.length} product types seeded`);

  // ── 4. Variants ──
  console.log('Seeding variants...');
  const variantDocs = VARIANTS_DATA.map(([numId, sku, catName, typeName, size, colorName, costPrice, sellPrice, stockQty, lowStockThreshold]) => ({
    sku,
    category: categoryMap[catName],
    productType: ptByName[typeName],
    size,
    color: colorMap[colorName],
    costPrice,
    sellPrice,
    stockQty,
    lowStockThreshold,
    isActive: true,
    images: [],
  }));
  const variants = await Variant.insertMany(variantDocs);

  // Build numericId → MongoDB _id map using insertion order (matches VARIANTS_DATA order)
  const variantIdMap = {};
  VARIANTS_DATA.forEach(([numId], index) => {
    variantIdMap[numId] = variants[index]._id;
  });
  console.log(`✓ ${variants.length} variants seeded`);

  // ── 5. Stock Movements (initial IN for all variants with stockQty > 0) ──
  console.log('Seeding initial stock movements...');
  const movementDocs = [];
  for (let i = 0; i < VARIANTS_DATA.length; i++) {
    const [numId, sku, , , , , costPrice, , stockQty] = VARIANTS_DATA[i];
    if (stockQty > 0) {
      movementDocs.push({
        variant: variantIdMap[numId],
        type: 'IN',
        qty: stockQty,
        qtyBefore: 0,
        qtyAfter: stockQty,
        costPrice,
        reason: 'Initial stock',
        createdAt: new Date('2026-03-01'),
      });
    }
  }
  await StockMovement.insertMany(movementDocs);
  console.log(`✓ ${movementDocs.length} stock movements seeded`);

  // ── 6. Coupon Codes ──
  console.log('Seeding coupon codes...');
  const coupons = await CouponCode.insertMany(COUPONS_DATA);
  const couponMap = {};
  coupons.forEach((c) => { couponMap[c.code] = c._id; });
  console.log(`✓ ${coupons.length} coupon codes seeded`);

  // ── 7. Orders ──
  console.log('Seeding orders...');
  const orderDocs = ORDERS_DATA.map(([orderRef, customerName, customerPhone, couponCode, subtotal, discountAmount, total, status, createdAt, rawItems, paymentMethod, deliveryFee]) => {
    const items = rawItems.map(([numVarId, qty, unitPrice, lineTotal]) => {
      const vData = VARIANTS_DATA.find(([id]) => id === numVarId);
      const costPrice = vData ? vData[6] : 0;
      return {
        variant: variantIdMap[numVarId],
        variantLabel: buildLabel(numVarId),
        qty,
        unitPrice,
        costPrice,
        lineTotal,
        discountType: null,
        discount: 0,
        discountAmount: 0,
        lineFinal: lineTotal,
      };
    });

    return {
      orderRef,
      customerName,
      customerPhone,
      items,
      subtotal,
      itemDiscountAmount: 0,
      coupon: couponCode ? couponMap[couponCode] : null,
      couponCode: couponCode || '',
      discountAmount,
      manualDiscountType: null,
      manualDiscount: 0,
      manualDiscountAmount: 0,
      total,
      paymentMethod: paymentMethod || 'BankTransfer',
      deliveryFee: deliveryFee || 0,
      status,
      createdAt: new Date(createdAt),
    };
  });

  await Order.insertMany(orderDocs);
  console.log(`✓ ${orderDocs.length} orders seeded`);

  console.log('\n✅ Seed complete!\n');
  await mongoose.disconnect();
}

function buildLabel(numId) {
  const row = VARIANTS_DATA.find(([id]) => id === numId);
  if (!row) return '';
  const [, , catName, typeName, size, colorName] = row;
  return `${catName} / ${typeName}${size !== 'N/A' ? ` / ${size}` : ''} / ${colorName}`;
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
