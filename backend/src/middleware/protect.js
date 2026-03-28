const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

module.exports = protect;
