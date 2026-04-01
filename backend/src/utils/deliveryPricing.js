const { SRI_LANKA_PROVINCES } = require('./sriLankaGeo');

const DEFAULT_BASE_WEIGHT_GRAMS = 1000;
const DEFAULT_ADDITIONAL_PER_KG_FEE = 100;

const DEFAULT_PROVINCE_BASE_FEES = {
  Western: 350,
  Central: 300,
  Southern: 300,
  Northern: 300,
  Eastern: 300,
  'North Western': 300,
  'North Central': 300,
  Uva: 300,
  Sabaragamuwa: 300,
};

const toNonNegativeNumber = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const normalizeProvince = (province) => {
  const raw = String(province || '').trim();
  if (!raw) return '';
  const match = SRI_LANKA_PROVINCES.find((name) => name.toLowerCase() === raw.toLowerCase());
  return match || raw;
};

const resolveProvinceBaseFees = (rawFees = {}, fallbackBaseFee = 300) => {
  const resolved = {};
  for (const province of SRI_LANKA_PROVINCES) {
    const fallback = DEFAULT_PROVINCE_BASE_FEES[province] ?? fallbackBaseFee;
    resolved[province] = toNonNegativeNumber(rawFees?.[province], fallback);
  }
  return resolved;
};

const sanitizeDeliveryPricing = (raw = {}, options = {}) => {
  const fallbackBase = toNonNegativeNumber(options.fallbackBaseFee, 300);
  return {
    provinceBaseFees: resolveProvinceBaseFees(raw.provinceBaseFees, fallbackBase),
    baseWeightGrams: Math.max(1, Math.round(toNonNegativeNumber(raw.baseWeightGrams, DEFAULT_BASE_WEIGHT_GRAMS))),
    additionalPerKgFee: toNonNegativeNumber(raw.additionalPerKgFee, DEFAULT_ADDITIONAL_PER_KG_FEE),
  };
};

const calculateDeliveryFee = ({ province, totalWeightGrams, deliveryPricing, fallbackBaseFee = 300 }) => {
  const pricing = sanitizeDeliveryPricing(deliveryPricing, { fallbackBaseFee });
  const resolvedProvince = normalizeProvince(province);
  const provinceBaseFee = pricing.provinceBaseFees[resolvedProvince] ?? fallbackBaseFee;
  const safeWeight = Math.max(0, Math.round(Number(totalWeightGrams) || 0));
  const extraWeight = Math.max(0, safeWeight - pricing.baseWeightGrams);
  const extraSteps = extraWeight > 0 ? Math.ceil(extraWeight / 1000) : 0;
  const deliveryFee = provinceBaseFee + extraSteps * pricing.additionalPerKgFee;

  return {
    province: resolvedProvince,
    totalWeightGrams: safeWeight,
    provinceBaseFee,
    extraSteps,
    additionalPerKgFee: pricing.additionalPerKgFee,
    deliveryFee,
    pricing,
  };
};

module.exports = {
  DEFAULT_BASE_WEIGHT_GRAMS,
  DEFAULT_ADDITIONAL_PER_KG_FEE,
  DEFAULT_PROVINCE_BASE_FEES,
  normalizeProvince,
  sanitizeDeliveryPricing,
  calculateDeliveryFee,
};
