const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/imageController');

router.get('/:fileId', ctrl.streamImage);

module.exports = router;
