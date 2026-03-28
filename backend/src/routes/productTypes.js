const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/productTypeController');
const validate = require('../middleware/validate');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('category').notEmpty().withMessage('Category is required').isMongoId(),
  ],
  validate,
  ctrl.create
);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
