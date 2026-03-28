const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/couponController');
const validate = require('../middleware/validate');

// IMPORTANT: POST /validate must be before GET /:id
router.post(
  '/validate',
  [
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('orderSubtotal').isFloat({ min: 0 }).withMessage('Order subtotal must be >= 0'),
  ],
  validate,
  ctrl.validate
);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post(
  '/',
  [
    body('code').notEmpty().withMessage('Code is required').trim(),
    body('type').isIn(['percent', 'fixed']).withMessage('Type must be percent or fixed'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be >= 0'),
  ],
  validate,
  ctrl.create
);
router.put('/:id', ctrl.update);
router.patch('/:id/toggle', ctrl.toggle);
router.delete('/:id', ctrl.remove);

module.exports = router;
