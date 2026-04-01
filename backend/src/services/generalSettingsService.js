const GeneralSettings = require('../models/GeneralSettings');
const { sanitizeDeliveryPricing } = require('../utils/deliveryPricing');

const GENERAL_SETTINGS_KEY = 'general';
const GENERAL_SETTINGS_DEFAULTS = {
  currencyCode: 'LKR',
  timezone: 'Asia/Colombo',
  defaultLowStockThreshold: 5,
  defaultDeliveryFee: 300,
  deliveryPricing: sanitizeDeliveryPricing(
    {},
    { fallbackBaseFee: 300 }
  ),
  sellerWhatsappPhone: '',
};

const sanitizeGeneralSettings = (settings = {}) => ({
  currencyCode: settings.currencyCode || GENERAL_SETTINGS_DEFAULTS.currencyCode,
  timezone: settings.timezone || GENERAL_SETTINGS_DEFAULTS.timezone,
  defaultLowStockThreshold:
    Number.isFinite(Number(settings.defaultLowStockThreshold))
      ? Number(settings.defaultLowStockThreshold)
      : GENERAL_SETTINGS_DEFAULTS.defaultLowStockThreshold,
  defaultDeliveryFee:
    Number.isFinite(Number(settings.defaultDeliveryFee))
      ? Number(settings.defaultDeliveryFee)
      : GENERAL_SETTINGS_DEFAULTS.defaultDeliveryFee,
  deliveryPricing: sanitizeDeliveryPricing(settings.deliveryPricing, {
    fallbackBaseFee:
      Number.isFinite(Number(settings.defaultDeliveryFee))
        ? Number(settings.defaultDeliveryFee)
        : GENERAL_SETTINGS_DEFAULTS.defaultDeliveryFee,
  }),
  sellerWhatsappPhone: String(settings.sellerWhatsappPhone || GENERAL_SETTINGS_DEFAULTS.sellerWhatsappPhone).trim(),
});

const getOrCreateGeneralSettings = async () => {
  let settings = await GeneralSettings.findOne({ key: GENERAL_SETTINGS_KEY }).select('-__v');
  if (settings) return settings;

  settings = await GeneralSettings.create({
    key: GENERAL_SETTINGS_KEY,
    ...GENERAL_SETTINGS_DEFAULTS,
  });
  return GeneralSettings.findById(settings._id).select('-__v');
};

const getResolvedGeneralSettings = async () => {
  const settings = await getOrCreateGeneralSettings();
  return sanitizeGeneralSettings(settings.toObject ? settings.toObject() : settings);
};

module.exports = {
  GENERAL_SETTINGS_DEFAULTS,
  GENERAL_SETTINGS_KEY,
  getOrCreateGeneralSettings,
  getResolvedGeneralSettings,
  sanitizeGeneralSettings,
};
