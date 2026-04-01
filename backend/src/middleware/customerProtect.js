const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

/**
 * Customer auth middleware — completely separate from admin protect.js.
 * Sets req.customer if a valid customer JWT is present.
 * Returns 401 if token is missing or invalid.
 */
const customerProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(401).json({ success: false, message: 'Invalid token type.' });
    }
    const customer = await Customer.findById(decoded.id).select('-password');
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Customer account not found.' });
    }
    req.customer = customer;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token expired or invalid. Please sign in again.' });
  }
};

/**
 * Optional customer auth — attaches req.customer if a valid token is present,
 * but does NOT block the request if absent or invalid.
 * Used in public endpoints that optionally benefit from knowing the customer.
 */
const optionalCustomerAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === 'customer') {
      const customer = await Customer.findById(decoded.id).select('-password');
      if (customer) req.customer = customer;
    }
  } catch {
    // Silently ignore invalid tokens — this is an optional check
  }
  next();
};

module.exports = { customerProtect, optionalCustomerAuth };
