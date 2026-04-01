/* =====================================================
   PEAKMALE — models/Cart.js
   ===================================================== */

const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Product',
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  // Snapshot price at time of adding — so price changes don't affect existing carts
  priceAtAdd: {
    type: Number,
    required: true,
  },
}, { _id: false });

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
      unique: true,    // one cart per user
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: total price
CartSchema.virtual('total').get(function () {
  return this.items.reduce((sum, item) => sum + item.priceAtAdd * item.qty, 0);
});

// Virtual: item count
CartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.qty, 0);
});

CartSchema.index({ user: 1 });

module.exports = mongoose.model('Cart', CartSchema);
