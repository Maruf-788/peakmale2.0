/* =====================================================
   PEAKMALE — routes/orders.js
   ===================================================== */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/',    ctrl.createOrder);
router.get('/:id',  ctrl.getOrder);

module.exports = router;
