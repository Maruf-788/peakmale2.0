/* =====================================================
   PEAKMALE — middleware/errorHandler.js
   Centralised error handling middleware
   ===================================================== */

const errorHandler = (err, req, res, next) => {
  // Log full error in dev
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err);
  } else {
    console.error('❌ Error:', err.message);
  }

  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // Mongoose duplicate key (e.g., duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message    = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode  = 409;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode  = 422;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message    = `Invalid ${err.path}: ${err.value}`;
    statusCode  = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
