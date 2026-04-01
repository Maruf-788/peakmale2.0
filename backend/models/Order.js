/* =====================================================
   PEAKMALE — models/Order.js
   Full payment + UPI verification schema
   ===================================================== */

const mongoose = require('mongoose');

/* ── Sub-schemas ────────────────────────────────────── */

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Product',
    required: true,
  },
  name:        { type: String, required: true },   // snapshot name
  image:       { type: String, required: true },   // snapshot image
  price:       { type: Number, required: true },   // snapshot price at purchase
  qty:         { type: Number, required: true, min: 1 },
  subtotal:    { type: Number, required: true },   // price * qty
}, { _id: false });

const ShippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone:    { type: String, required: true },
  line1:    { type: String, required: true },
  line2:    { type: String, default: '' },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true },
}, { _id: false });

/* ── Main Order Schema ──────────────────────────────── */

const OrderSchema = new mongoose.Schema(
  {
    // ── Identifiers ──────────────────────────────────
    orderNumber: {
      type:   String,
      unique: true,
      // auto-generated in pre-save hook below
    },
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Items Snapshot ───────────────────────────────
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message:   'Order must have at least one item',
      },
    },

    // ── Shipping ─────────────────────────────────────
    shippingAddress: {
      type:     ShippingAddressSchema,
      required: true,
    },
    shippingCharge: {
      type:    Number,
      default: 0,
    },

    // ── Pricing ───────────────────────────────────────
    subtotal:    { type: Number, required: true },  // items total
    totalAmount: { type: Number, required: true },  // subtotal + shipping

    // ── Payment ───────────────────────────────────────
    paymentMethod: {
      type:     String,
      required: true,
      enum:     ['UPI', 'COD'],
    },
    paymentStatus: {
      type:    String,
      enum:    ['pending', 'verification_pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    // UTR = Unique Transaction Reference — provided by customer after UPI payment
    utr: {
      type:    String,
      default: null,
      trim:    true,
      uppercase: true,
    },
    // Optional screenshot of payment proof uploaded by customer
    paymentScreenshot: {
      type:    String,   // URL (Cloudinary / S3 / local /uploads path)
      default: null,
    },
    // Timestamp when customer submitted UTR
    utrSubmittedAt: {
      type:    Date,
      default: null,
    },
    // Admin who verified the payment
    verifiedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    verifiedAt: {
      type:    Date,
      default: null,
    },
    // Admin notes on verification
    adminNote: {
      type:    String,
      default: '',
    },

    // ── Order Status ──────────────────────────────────
    orderStatus: {
      type:    String,
      enum:    ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
    trackingNumber: {
      type:    String,
      default: null,
    },

    // ── COD ───────────────────────────────────────────
    codCharge: {
      type:    Number,
      default: 0,    // you can add ₹40 COD charge if needed
    },

    // ── Customer notes ───────────────────────────────
    notes: {
      type:    String,
      default: '',
    },
  },
  {
    timestamps: true,    // createdAt, updatedAt
  }
);

/* ── Auto-generate readable order number ─────────────── */
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const date    = new Date();
    const yymmdd  = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const rand    = Math.floor(Math.random() * 90000) + 10000;  // 5-digit random
    this.orderNumber = `PM-${yymmdd}-${rand}`;
  }
  next();
});

/* ── Indexes ──────────────────────────────────────────── */
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ paymentStatus: 1, orderStatus: 1 });
OrderSchema.index({ utr: 1 });

module.exports = mongoose.model('Order', OrderSchema);
