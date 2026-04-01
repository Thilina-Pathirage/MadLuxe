const { success } = require('../utils/apiResponse');
const { getOrCreateGeneralSettings, getResolvedGeneralSettings } = require('../services/generalSettingsService');
const { sanitizeDeliveryPricing } = require('../utils/deliveryPricing');

const getGeneralSettings = async (req, res, next) => {
  try {
    const settings = await getResolvedGeneralSettings();
    return success(res, { data: settings });
  } catch (err) {
    next(err);
  }
};

const updateGeneralSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateGeneralSettings();
    settings.currencyCode = req.body.currencyCode;
    settings.timezone = req.body.timezone;
    settings.defaultLowStockThreshold = Number(req.body.defaultLowStockThreshold);
    settings.defaultDeliveryFee = Number(req.body.defaultDeliveryFee);
    settings.deliveryPricing = sanitizeDeliveryPricing(req.body.deliveryPricing, {
      fallbackBaseFee: Number(req.body.defaultDeliveryFee),
    });
    settings.sellerWhatsappPhone = String(req.body.sellerWhatsappPhone || '').trim();
    await settings.save();
    const resolved = await getResolvedGeneralSettings();

    return success(res, { data: resolved }, 'General settings updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getGeneralSettings, updateGeneralSettings };
