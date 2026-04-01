/* =====================================================
   PEAKMALE — server.js
   Production-grade Express server entry point
   ===================================================== */

'use strict';

require('dotenv').config();

const express     = require('express');
const mongoose    = require('mongoose');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

// ── Route Imports ──────────────────────────────────────
const productRoutes = require('./routes/products');
const userRoutes    = require('./routes/users');
const cartRoutes    = require('./routes/cart');
const orderRoutes   = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const adminRoutes   = require('./routes/admin');

// ── Middleware Imports ─────────────────────────────────
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ────────────────────────────────────────────────────────
   SECURITY MIDDLEWARE
   ──────────────────────────────────────────────────────── */

// Helmet sets secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — allow frontend origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limiter — prevents abuse
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

/* ────────────────────────────────────────────────────────
   BODY PARSING MIDDLEWARE
   ──────────────────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded screenshots from /uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ────────────────────────────────────────────────────────
   DATABASE CONNECTION
   ──────────────────────────────────────────────────────── */
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

/* ────────────────────────────────────────────────────────
   ROUTES
   ──────────────────────────────────────────────────────── */

// Health check — for Render.com keep-alive pings
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status:  'ok',
    env:     process.env.NODE_ENV,
    ts:      new Date().toISOString(),
  });
});

app.use('/api/products', productRoutes);
app.use('/api/users',    authLimiter, userRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/payment',  paymentRoutes);
app.use('/api/admin',    adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

/* ────────────────────────────────────────────────────────
   START SERVER
   ──────────────────────────────────────────────────────── */
const server = app.listen(PORT, () => {
  console.log(`🚀 PeakMale API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close();
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
