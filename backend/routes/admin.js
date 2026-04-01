/* =====================================================
   PEAKMALE — routes/admin.js
   All routes require admin role
   ===================================================== */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes are protected
router.use(protect, adminOnly);

router.get('/stats',                     ctrl.getDashboardStats);
router.get('/orders',                    ctrl.getAllOrders);
router.get('/orders/:id',                ctrl.getOrderById);
router.patch('/orders/:id/verify',       ctrl.verifyPayment);
router.patch('/orders/:id/status',       ctrl.updateOrderStatus);

module.exports = router;
