const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/financeController');
const validate = require('../middleware/validate');

router.get('/summary', ctrl.getSummary);
router.get('/breakdown', ctrl.getBreakdown);
router.get('/top-selling', ctrl.getTopSelling);
router.get(
  '/manual-entries',
  [
    query('type').optional().isIn(['income', 'expense']).withMessage('type must be income or expense'),
    query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid date'),
    query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid date'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be between 1 and 200'),
  ],
  validate,
  ctrl.getManualEntries
);
router.post(
  '/manual-entries',
  [
    body('type').isIn(['income', 'expense']).withMessage('type must be income or expense'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be > 0'),
    body('reason').trim().notEmpty().withMessage('reason is required').isLength({ max: 200 }).withMessage('reason must be <= 200 characters'),
    body('entryDate').isISO8601().withMessage('entryDate must be a valid date'),
  ],
  validate,
  ctrl.createManualEntry
);
router.put(
  '/manual-entries/:id',
  [
    param('id').isMongoId().withMessage('valid ID required'),
    body('type').isIn(['income', 'expense']).withMessage('type must be income or expense'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be > 0'),
    body('reason').trim().notEmpty().withMessage('reason is required').isLength({ max: 200 }).withMessage('reason must be <= 200 characters'),
    body('entryDate').isISO8601().withMessage('entryDate must be a valid date'),
  ],
  validate,
  ctrl.updateManualEntry
);
router.delete(
  '/manual-entries/:id',
  [param('id').isMongoId().withMessage('valid ID required')],
  validate,
  ctrl.deleteManualEntry
);

module.exports = router;
