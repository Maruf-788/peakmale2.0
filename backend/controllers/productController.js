/* =====================================================
   PEAKMALE — controllers/productController.js
   ===================================================== */

const Product = require('../models/Product');

/* ── GET /api/products ─────────────────────────────── */
exports.getProducts = async (req, res, next) => {
  try {
    const { category, featured, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;

    const query = { isActive: true };
    if (category)  query.category = category.toLowerCase();
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count:   products.length,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / parseInt(limit)),
      data:    products,
    });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/products/:id ─────────────────────────── */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    }).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/products — Admin only ───────────────── */
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/* ── PATCH /api/products/:id — Admin only ──────────── */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/* ── DELETE /api/products/:id — Admin only (soft delete) */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
};
