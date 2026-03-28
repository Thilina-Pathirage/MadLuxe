const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const validate = require('../middleware/validate');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('Items array is required'),
    body('items.*.variantId').notEmpty().isMongoId().withMessage('Valid variant ID required for each item'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  ],
  validate,
  ctrl.create
);
router.patch('/:id/cancel', ctrl.cancel);

module.exports = router;
