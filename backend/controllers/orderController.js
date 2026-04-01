/* =====================================================
   PEAKMALE — controllers/orderController.js
   ===================================================== */

const Order   = require('../models/Order');
const Cart    = require('../models/Cart');
const Product = require('../models/Product');

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_CHARGE         = 60;
const COD_CHARGE              = 0;   // set to 40 if you want to charge

/* ── POST /api/orders — Create new order ─────────────── */
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'shippingAddress and paymentMethod are required',
      });
    }
    if (!['UPI', 'COD'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'paymentMethod must be UPI or COD' });
    }

    // Fetch user's cart with product details
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Build order items + validate stock
    const orderItems = [];
    let subtotal     = 0;

    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product?.name || 'unknown'}" is no longer available`,
        });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units of "${product.name}" available`,
        });
      }

      const itemSubtotal = product.price * item.qty;
      subtotal += itemSubtotal;

      orderItems.push({
        product:  product._id,
        name:     product.name,
        image:    product.image,
        price:    product.price,
        qty:      item.qty,
        subtotal: itemSubtotal,
      });
    }

    const shippingCharge = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
    const codCharge      = paymentMethod === 'COD' ? COD_CHARGE : 0;
    const totalAmount    = subtotal + shippingCharge + codCharge;

    // Create order (paymentStatus starts as 'pending')
    const order = await Order.create({
      user:            req.user._id,
      items:           orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCharge,
      codCharge,
      totalAmount,
      notes:           notes || '',
      // COD orders are auto-confirmed for payment
      paymentStatus:   paymentMethod === 'COD' ? 'pending' : 'pending',
    });

    // Decrement stock for each product
    await Promise.all(
      orderItems.map(item =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } })
      )
    );

    // Clear cart after order is placed
    await Cart.findOneAndDelete({ user: req.user._id });

    // Return order with UPI details if payment is UPI
    const responseData = {
      order,
      ...(paymentMethod === 'UPI' && {
        upiDetails: {
          upiId:   process.env.UPI_ID   || 'peakmale@upi',
          name:    process.env.UPI_NAME || 'PeakMale Store',
          amount:  totalAmount,
          qrUrl:   process.env.UPI_QR_URL || null,
          orderId: order._id,
          orderNumber: order.orderNumber,
        },
      }),
    };

    res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/orders/:id — Get single order ─────────── */
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id:  req.params.id,
      user: req.user._id,
    }).populate('items.product', 'name image');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
