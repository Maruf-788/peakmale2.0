/* =====================================================
   PEAKMALE — controllers/paymentController.js
   Manual UPI QR Payment System
   ===================================================== */

const Order = require('../models/Order');
const path  = require('path');

/* ── POST /api/payment/submit-utr ────────────────────────
   Customer submits their UTR after completing UPI payment.
   This sets paymentStatus to "verification_pending".
   Admin will manually verify the UTR in their payment app.
   ──────────────────────────────────────────────────────── */
exports.submitUTR = async (req, res, next) => {
  try {
    const { orderId, utr } = req.body;

    if (!orderId || !utr) {
      return res.status(400).json({ success: false, message: 'orderId and utr are required' });
    }

    // Basic UTR format validation (alphanumeric, 12–22 chars)
    const utrClean = utr.trim().toUpperCase();
    if (!/^[A-Z0-9]{12,22}$/.test(utrClean)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UTR format. Please check and re-enter.',
      });
    }

    const order = await Order.findOne({
      _id:  orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.paymentMethod !== 'UPI') {
      return res.status(400).json({ success: false, message: 'This order is not a UPI order' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Payment already verified' });
    }
    if (order.paymentStatus === 'verification_pending') {
      return res.status(400).json({ success: false, message: 'UTR already submitted. Awaiting admin verification.' });
    }

    // Check if this UTR has been used in any other order (prevent duplicate submissions)
    const duplicateUTR = await Order.findOne({ utr: utrClean, _id: { $ne: orderId } });
    if (duplicateUTR) {
      return res.status(409).json({
        success: false,
        message: 'This UTR has already been used. If this is an error, contact support.',
      });
    }

    order.utr              = utrClean;
    order.paymentStatus    = 'verification_pending';
    order.utrSubmittedAt   = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'UTR submitted successfully! Payment will be verified within 24 hours.',
      data: {
        orderId:       order._id,
        orderNumber:   order.orderNumber,
        paymentStatus: order.paymentStatus,
        utr:           order.utr,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/payment/upload-screenshot ─────────────────
   Customer uploads screenshot of payment as additional proof.
   File is stored locally under /uploads/screenshots/.
   In production, replace with Cloudinary/S3.
   ──────────────────────────────────────────────────────── */
exports.uploadScreenshot = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Build public URL for the screenshot
    const screenshotUrl = `/uploads/screenshots/${req.file.filename}`;
    order.paymentScreenshot = screenshotUrl;
    await order.save();

    res.json({
      success: true,
      message: 'Screenshot uploaded successfully.',
      data: { screenshotUrl },
    });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/payment/upi-details ────────────────────────
   Returns current UPI payment details for the checkout page.
   ──────────────────────────────────────────────────────── */
exports.getUpiDetails = async (req, res) => {
  res.json({
    success: true,
    data: {
      upiId:  process.env.UPI_ID   || 'peakmale@upi',
      name:   process.env.UPI_NAME || 'PeakMale Store',
      qrUrl:  process.env.UPI_QR_URL || null,
    },
  });
};
