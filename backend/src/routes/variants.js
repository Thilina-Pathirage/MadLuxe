const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/variantController');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const MAX_IMAGES_PER_VARIANT = parseInt(process.env.MAX_IMAGES_PER_VARIANT, 10) || 10;

// IMPORTANT: /low-stock/count MUST be declared before /:id
router.get('/low-stock/count', ctrl.getLowStockCount);

router.get('/', ctrl.getAll);
router.post(
  '/',
  upload.array('images', MAX_IMAGES_PER_VARIANT),
  [
    body('categoryId').notEmpty().isMongoId().withMessage('Valid category ID required'),
    body('productTypeId').notEmpty().isMongoId().withMessage('Valid product type ID required'),
    body('colorId').notEmpty().isMongoId().withMessage('Valid color ID required'),
    body('costPrice').notEmpty().isFloat({ min: 0 }).withMessage('Cost price must be >= 0'),
    body('sellPrice').notEmpty().isFloat({ min: 0 }).withMessage('Sell price must be >= 0'),
    body('weightGrams').notEmpty().isFloat({ min: 1 }).withMessage('Weight (grams) must be >= 1'),
    body('stockQty').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Stock quantity must be >= 0'),
    body('lowStockThreshold').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Low stock threshold must be >= 0'),
  ],
  validate,
  ctrl.create
);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
