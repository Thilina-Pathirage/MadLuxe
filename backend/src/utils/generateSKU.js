const CAT_CODES = {
  Bedsheets: 'BS',
  Blankets: 'BL',
  'Sofa Pillow Covers': 'SPC',
  'Table Runners': 'TR',
  'Table Cloths': 'TC',
};

const TYPE_CODES = {
  Stripe: 'STR',
  'Egyptian Cotton': 'EGY',
  'Printed Checks': 'CHK',
  Waffle: 'WFL',
  Ribbed: 'RBD',
  'Pineapple Grid': 'PNG',
  'Ribbed Design': 'RDS',
  'Royal Type 1': 'RY1',
  'Royal Type 2': 'RY2',
  Popcorn: 'POP',
  Standard: 'STD',
  'Inside Colour Type': 'ICT',
};

const pad3 = (n) => String(n).padStart(3, '0');
const abbrev = (str, len = 3) =>
  str.replace(/\s+/g, '').substring(0, len).toUpperCase();

const generateSKU = async (categoryName, typeName) => {
  // Deferred require to avoid circular dependency at module load time
  const Variant = require('../models/Variant');

  const catCode = CAT_CODES[categoryName] || abbrev(categoryName);
  const typeCode = TYPE_CODES[typeName] || abbrev(typeName);
  const base = `${catCode}-${typeCode}`;

  // Count existing variants with this prefix to pick the next number
  const count = await Variant.countDocuments({
    sku: new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-`),
  });

  let num = count + 1;
  let sku = `${base}-${pad3(num)}`;

  // Collision-safe loop (handles gaps or out-of-order inserts)
  while (await Variant.exists({ sku })) {
    num++;
    sku = `${base}-${pad3(num)}`;
  }

  return sku;
};

module.exports = generateSKU;
