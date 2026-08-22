class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, details);
  }
}

class OpenAIError extends AppError {
  constructor(message, details = null, statusCode = 502) {
    super(message, statusCode, details);
  }
}

class DatabaseError extends AppError {
  constructor(message, details = null) {
    super(message, 500, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  OpenAIError,
  DatabaseError,
};
