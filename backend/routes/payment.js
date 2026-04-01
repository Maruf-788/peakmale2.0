/* =====================================================
   PEAKMALE — routes/payment.js
   ===================================================== */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paymentController');
const upload  = require('../middleware/upload');
const { protect } = require('../middleware/auth');

// UPI details are public (shown before login on checkout)
router.get('/upi-details', ctrl.getUpiDetails);

// Protected payment routes
router.post('/submit-utr',         protect, ctrl.submitUTR);
router.post('/upload-screenshot',  protect, upload.single('screenshot'), ctrl.uploadScreenshot);

module.exports = router;
