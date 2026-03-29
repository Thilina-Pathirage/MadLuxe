const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

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
router.post('/:id/landing-image', upload.single('image'), ctrl.uploadLandingImage);
router.delete('/:id/landing-image', ctrl.removeLandingImage);

module.exports = router;
