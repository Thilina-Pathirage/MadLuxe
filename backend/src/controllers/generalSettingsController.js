const { success } = require('../utils/apiResponse');
const { getOrCreateGeneralSettings } = require('../services/generalSettingsService');

const getGeneralSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateGeneralSettings();
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
    settings.sellerWhatsappPhone = String(req.body.sellerWhatsappPhone || '').trim();
    await settings.save();

    return success(res, { data: settings }, 'General settings updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getGeneralSettings, updateGeneralSettings };
