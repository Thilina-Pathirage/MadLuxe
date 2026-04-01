const express = require('express');
const router = express.Router();
const { customerProtect } = require('../middleware/customerProtect');
const customerAuthCtrl = require('../controllers/customerAuthController');
const customerOrderCtrl = require('../controllers/customerOrderController');

// Public
router.post('/register', customerAuthCtrl.register);
router.post('/login', customerAuthCtrl.login);

// Protected (customer JWT required)
router.get('/me', customerProtect, customerAuthCtrl.getMe);
router.put('/profile', customerProtect, customerAuthCtrl.updateProfile);
router.get('/orders', customerProtect, customerOrderCtrl.getMyOrders);
router.get('/orders/:id', customerProtect, customerOrderCtrl.getMyOrderById);

module.exports = router;
