/* =====================================================
   PEAKMALE — controllers/cartController.js
   ===================================================== */

const Cart    = require('../models/Cart');
const Product = require('../models/Product');

/* ── GET /api/cart ───────────────────────────────────── */
exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name image price isActive stock')
      .lean();

    if (!cart) {
      return res.json({ success: true, data: { items: [], total: 0, itemCount: 0 } });
    }

    // Filter out deactivated products and compute totals
    const validItems = cart.items.filter(item => item.product && item.product.isActive);
    const total      = validItems.reduce((sum, i) => sum + i.priceAtAdd * i.qty, 0);
    const itemCount  = validItems.reduce((sum, i) => sum + i.qty, 0);

    res.json({
      success: true,
      data: { ...cart, items: validItems, total, itemCount },
    });
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/cart ─ Add or update item ─────────────── */
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, qty = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    if (qty < 1 || qty > 20) {
      return res.status(400).json({ success: false, message: 'Qty must be between 1 and 20' });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units in stock` });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIdx = cart.items.findIndex(
      i => i.product.toString() === productId
    );

    if (existingIdx > -1) {
      cart.items[existingIdx].qty = qty;
    } else {
      cart.items.push({ product: productId, qty, priceAtAdd: product.price });
    }

    await cart.save();

    const populated = await Cart.findById(cart._id)
      .populate('items.product', 'name image price stock')
      .lean();

    const total     = populated.items.reduce((s, i) => s + i.priceAtAdd * i.qty, 0);
    const itemCount = populated.items.reduce((s, i) => s + i.qty, 0);

    res.json({ success: true, data: { ...populated, total, itemCount } });
  } catch (err) {
    next(err);
  }
};

/* ── DELETE /api/cart/:productId — Remove one item ──── */
exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      i => i.product.toString() !== req.params.productId
    );
    await cart.save();

    res.json({ success: true, message: 'Item removed', data: cart });
  } catch (err) {
    next(err);
  }
};

/* ── DELETE /api/cart — Clear entire cart ────────────── */
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};
