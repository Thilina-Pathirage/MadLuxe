const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/stockMovementController');
const validate = require('../middleware/validate');

router.get('/', ctrl.getAll);

router.post(
  '/stock-in',
  [
    body('variantId').notEmpty().isMongoId().withMessage('Valid variant ID required'),
    body('qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be >= 0'),
  ],
  validate,
  ctrl.stockIn
);

router.post(
  '/adjust',
  [
    body('variantId').notEmpty().isMongoId().withMessage('Valid variant ID required'),
    body('qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('adjustDirection').isIn(['add', 'reduce']).withMessage('adjustDirection must be add or reduce'),
    body('reason').notEmpty().withMessage('Reason is required'),
  ],
  validate,
  ctrl.adjust
);

module.exports = router;
