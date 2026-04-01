/* =====================================================
   PEAKMALE — routes/users.js
   ===================================================== */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        protect, ctrl.getMe);
router.patch('/me',      protect, ctrl.updateMe);
router.post('/address',  protect, ctrl.addAddress);
router.get('/orders',    protect, ctrl.getMyOrders);

module.exports = router;
