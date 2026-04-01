/* =====================================================
   PEAKMALE — routes/cart.js
   ===================================================== */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// All cart routes require login
router.use(protect);

router.get('/',                    ctrl.getCart);
router.post('/',                   ctrl.addToCart);
router.delete('/clear',            ctrl.clearCart);
router.delete('/:productId',       ctrl.removeFromCart);

module.exports = router;
