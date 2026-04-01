/* =====================================================
   PEAKMALE — models/Product.js
   ===================================================== */

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['gaming', 'tech', 'diecast'],
      lowercase: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    comparePrice: {
      type: Number,
      default: null, // original price if on sale
    },
    stock: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
    images: [{ type: String }],   // additional images gallery
    badge: {
      type: String,
      default: '',
    },
    tags: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    weight: {
      type: Number,   // in grams, for shipping calc
      default: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Auto-generate slug from name before saving
ProductSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual: discount percentage
ProductSchema.virtual('discountPercent').get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// Index for fast filtering & search
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ isFeatured: -1, createdAt: -1 });

module.exports = mongoose.model('Product', ProductSchema);
