const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const signToken = (id) =>
  jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeCustomer = (customer) => ({
  _id: customer._id,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  address: customer.address,
  province: customer.province,
  district: customer.district,
  city: customer.city,
  createdAt: customer.createdAt,
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, province, district, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const customer = await Customer.create({ name, email, password, phone, address, province, district, city });
    const token = signToken(customer._id);

    return res.status(201).json({ success: true, token, customer: safeCustomer(customer) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(customer._id);
    return res.status(200).json({ success: true, token, customer: safeCustomer(customer) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Login failed.' });
  }
};

exports.getMe = async (req, res) => {
  return res.status(200).json({ success: true, customer: safeCustomer(req.customer) });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, province, district, city } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (province !== undefined) updates.province = province;
    if (district !== undefined) updates.district = district;
    if (city !== undefined) updates.city = city;

    if (updates.name !== undefined && updates.name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.customer._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({ success: true, customer: safeCustomer(customer) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Profile update failed.' });
  }
};
