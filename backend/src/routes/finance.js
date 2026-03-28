const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/financeController');

router.get('/summary', ctrl.getSummary);
router.get('/breakdown', ctrl.getBreakdown);
router.get('/top-selling', ctrl.getTopSelling);

module.exports = router;
