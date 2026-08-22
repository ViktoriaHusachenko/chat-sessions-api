const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = statusCode >= 500 ? 'Internal server error' : (err.message || 'Request failed');

  const payload = {
    error: {
      message,
      type: err.name || 'Error',
    },
  };

  if (process.env.NODE_ENV !== 'production' && err.details) {
    payload.error.details = err.details;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  errorHandler,
};
