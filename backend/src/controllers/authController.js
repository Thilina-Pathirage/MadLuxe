const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return error(res, 'Username and password are required', 400);
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return error(res, 'Invalid credentials', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, 'Invalid credentials', 401);

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return success(res, {
      token,
      user: { id: user._id, username: user.username, role: user.role },
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    return success(res, { user: req.user });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    return success(res, {}, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, logout };
