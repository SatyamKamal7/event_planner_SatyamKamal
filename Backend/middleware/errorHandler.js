const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          success: false,
          error: 'Resource already exists'
        });
      case '23503': // foreign_key_violation
        return res.status(400).json({
          success: false,
          error: 'Referenced resource not found'
        });
      case '23502': // not_null_violation
        return res.status(400).json({
          success: false,
          error: 'Required field missing'
        });
      case '22P02': // invalid_text_representation
        return res.status(400).json({
          success: false,
          error: 'Invalid data format'
        });
      default:
        return res.status(500).json({
          success: false,
          error: 'Database error occurred'
        });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  notFound
};