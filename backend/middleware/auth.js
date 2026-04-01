/* =====================================================
   PEAKMALE — middleware/auth.js
   JWT authentication middleware
   ===================================================== */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — requires a valid JWT in Authorization header
 * Sets req.user for downstream route handlers
 */
const protect = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorised. No token provided.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token. Please log in again.';
      return res.status(401).json({ success: false, message: msg });
    }

    // Fetch fresh user from DB (ensures account still active)
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * adminOnly — use after protect; restricts to admin role
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({
    success: false,
    message: 'Forbidden. Admin access required.',
  });
};

module.exports = { protect, adminOnly };
