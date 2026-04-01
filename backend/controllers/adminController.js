/* =====================================================
   PEAKMALE — controllers/adminController.js
   Admin dashboard: view orders, verify payments
   ===================================================== */

const Order   = require('../models/Order');
const Product = require('../models/Product');
const User    = require('../models/User');

/* ── GET /api/admin/orders ────────────────────────────── */
exports.getAllOrders = async (req, res, next) => {
  try {
    const {
      paymentStatus,
      paymentMethod,
      orderStatus,
      page  = 1,
      limit = 25,
      sort  = '-createdAt',
    } = req.query;

    const query = {};
    if (paymentStatus)  query.paymentStatus  = paymentStatus;
    if (paymentMethod)  query.paymentMethod  = paymentMethod;
    if (orderStatus)    query.orderStatus    = orderStatus;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email phone')
      .lean();

    res.json({
      success: true,
      count:   orders.length,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / parseInt(limit)),
      data:    orders,
    });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/admin/orders/:id ────────────────────────── */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone addresses')
      .populate('items.product', 'name image price');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

/* ── PATCH /api/admin/orders/:id/verify ──────────────────
   Admin manually verifies the UPI payment after
   checking their bank/payment app for the UTR.
   ──────────────────────────────────────────────────────── */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { action, adminNote } = req.body;
    // action = 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be 'approve' or 'reject'",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentMethod !== 'UPI') {
      return res.status(400).json({ success: false, message: 'This is not a UPI order' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Payment already verified as paid' });
    }

    if (action === 'approve') {
      order.paymentStatus = 'paid';
      order.orderStatus   = 'confirmed';
      order.verifiedBy    = req.user._id;
      order.verifiedAt    = new Date();
      order.adminNote     = adminNote || 'Payment verified by admin';
    } else {
      order.paymentStatus = 'failed';
      order.orderStatus   = 'placed';
      order.adminNote     = adminNote || 'Payment verification failed';
    }

    await order.save();

    res.json({
      success: true,
      message: action === 'approve'
        ? `Order ${order.orderNumber} payment verified ✓`
        : `Order ${order.orderNumber} payment rejected`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/* ── PATCH /api/admin/orders/:id/status ──────────────── */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, trackingNumber } = req.body;

    const validStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus,
        ...(trackingNumber && { trackingNumber }),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/admin/stats ─────────────────────────────── */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingVerification,
      paidOrders,
      totalRevenue,
      todayOrders,
      totalProducts,
      totalUsers,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'verification_pending' }),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user' }),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingVerification,
        paidOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayOrders,
        totalProducts,
        totalUsers,
      },
    });
  } catch (err) {
    next(err);
  }
};
