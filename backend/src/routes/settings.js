const express = require('express');
const { body } = require('express-validator');
const generalCtrl = require('../controllers/generalSettingsController');
const websiteCtrl = require('../controllers/websiteSettingsController');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

const isValidTimezone = (value) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

router.get('/general', generalCtrl.getGeneralSettings);
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
    body('sellerWhatsappPhone')
      .optional({ values: 'falsy' })
      .trim()
      .matches(/^\+?[0-9\s()-]{7,20}$/)
      .withMessage('Seller WhatsApp phone must be a valid phone number'),
  ],
  validate,
  generalCtrl.updateGeneralSettings
);

router.get('/website', websiteCtrl.getWebsiteSettings);
router.put(
  '/website',
  [
    body('heroSlides')
      .isArray({ min: 1, max: 6 })
      .withMessage('heroSlides must contain between 1 and 6 slides'),
    body('heroSlides.*.title')
      .trim()
      .notEmpty()
      .withMessage('Each slide title is required'),
    body('heroSlides.*.subtitle')
      .trim()
      .notEmpty()
      .withMessage('Each slide subtitle is required'),
    body('heroSlides.*.sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('sortOrder must be a non-negative integer'),
  ],
  validate,
  websiteCtrl.updateWebsiteSettings
);
router.post('/website/hero-image', upload.single('image'), websiteCtrl.uploadHeroImage);

module.exports = router;
