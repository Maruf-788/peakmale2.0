/* =====================================================
   PEAKMALE — routes/products.js
   ===================================================== */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/',    ctrl.getProducts);
router.get('/:id', ctrl.getProductById);

// Admin-only routes
router.post('/',       protect, adminOnly, ctrl.createProduct);
router.patch('/:id',   protect, adminOnly, ctrl.updateProduct);
router.delete('/:id',  protect, adminOnly, ctrl.deleteProduct);

module.exports = router;
