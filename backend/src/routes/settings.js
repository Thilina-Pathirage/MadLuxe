const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/generalSettingsController');
const validate = require('../middleware/validate');

const router = express.Router();

const isValidTimezone = (value) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

router.get('/general', ctrl.getGeneralSettings);
router.put(
  '/general',
  [
    body('currencyCode')
      .isIn(['LKR', 'USD', 'EUR', 'GBP'])
      .withMessage('Currency code must be one of LKR, USD, EUR or GBP'),
    body('timezone')
      .custom((value) => isValidTimezone(value))
      .withMessage('Timezone must be a valid IANA timezone'),
    body('defaultLowStockThreshold')
      .isFloat({ min: 0 })
      .withMessage('Default low stock threshold must be >= 0'),
    body('defaultDeliveryFee')
      .isFloat({ min: 0 })
      .withMessage('Default delivery fee must be >= 0'),
  ],
  validate,
  ctrl.updateGeneralSettings
);

module.exports = router;
