/* =====================================================
   PEAKMALE — models/User.js
   ===================================================== */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
  fullName:    { type: String, required: true },
  phone:       { type: String, required: true },
  line1:       { type: String, required: true },
  line2:       { type: String, default: '' },
  city:        { type: String, required: true },
  state:       { type: String, required: true },
  pincode:     { type: String, required: true },
  isDefault:   { type: Boolean, default: false },
}, { _id: true });

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,    // never returned in queries by default
    },
    phone: {
      type: String,
      default: '',
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    addresses: [AddressSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: compare plain password with hashed
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);
