const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/colorController');
const validate = require('../middleware/validate');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post(
  '/',
  [body('name').notEmpty().withMessage('Name is required').trim()],
  validate,
  ctrl.create
);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
