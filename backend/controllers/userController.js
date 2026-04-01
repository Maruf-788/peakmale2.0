/* =====================================================
   PEAKMALE — controllers/userController.js
   Registration, Login, Profile
   ===================================================== */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/* ── Helper: sign JWT ────────────────────────────────── */
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sendToken = (res, user, statusCode = 200) => {
  const token = signToken(user._id, user.role);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id:       user._id,
      name:      user.name,
      email:     user.email,
      phone:     user.phone,
      role:      user.role,
      addresses: user.addresses,
    },
  });
};

/* ── POST /api/users/register ────────────────────────── */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if email already taken
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered. Please log in.' });
    }

    const user = await User.create({ name, email, password, phone });
    sendToken(res, user, 201);
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/users/login ───────────────────────────── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Fetch user WITH password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendToken(res, user);
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/users/me — protected ──────────────────── */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/* ── PATCH /api/users/me — protected ────────────────── */
exports.updateMe = async (req, res, next) => {
  try {
    // Don't allow password update via this route
    const { password, role, ...updates } = req.body;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/users/address — protected ────────────── */
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // If setting as default, un-default all others
    if (req.body.isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push(req.body);
    await user.save();

    res.json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/users/orders — protected (my orders) ─── */
exports.getMyOrders = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'name image')
      .lean();

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};
