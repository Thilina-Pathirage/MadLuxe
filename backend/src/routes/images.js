const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/imageController');
const upload = require('../middleware/upload');
const MAX_IMAGES_PER_VARIANT = parseInt(process.env.MAX_IMAGES_PER_VARIANT, 10) || 10;

router.post('/upload/:variantId', upload.array('images', MAX_IMAGES_PER_VARIANT), ctrl.uploadImages);
router.put('/:variantId/primary/:imageId', ctrl.setPrimary);
router.delete('/:variantId/:imageId', ctrl.deleteImage);
router.get('/storage/health', ctrl.getStorageHealth);

module.exports = router;
