const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');

router.get('/stats', ctrl.getStats);

module.exports = router;
