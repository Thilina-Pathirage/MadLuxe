const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerController');

router.get('/', ctrl.getAllCustomers);
router.get('/:id/orders', ctrl.getCustomerOrders);

module.exports = router;
