// @desc    Error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = {
            statusCode: 404,
            message: message
        };
    }
    // Custom application errors
    if (err instanceof AppError) {
        error = {
            statusCode: err.statusCode,
            message: err.message
        };
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `Duplicate field value entered for ${field}`;
        error = {
            statusCode: 400,
            message: message
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = {
            statusCode: 400,
            message: message.join(', ')
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            statusCode: 401,
            message: 'Invalid token'
        };
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            statusCode: 401,
            message: 'Token expired'
        };
    }

    // Multer errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = {
            statusCode: 400,
            message: 'File size too large'
        };
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        error = {
            statusCode: 400,
            message: 'Too many files'
        };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = {
            statusCode: 400,
            message: 'Unexpected file type'
        };
    }

    // Custom error handling
    const statusCode = error.statusCode || res.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Include stack trace in development
    const response = {
        success: false,
        message: message,
        statusCode: statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    res.status(statusCode).json(response);
};

// @desc    Not found middleware
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// @desc    Validation error handler
const validationErrorHandler = (errors) => {
    const formattedErrors = {};
    
    errors.array().forEach(error => {
        formattedErrors[error.param] = error.msg;
    });

    return {
        success: false,
        message: 'Validation failed',
        errors: formattedErrors
    };
};

// @desc    Handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// @desc    Handle database errors
const handleDatabaseError = (err) => {
    const error = { ...err };
    
    // Connection error
    if (err.name === 'MongoNetworkError') {
        error.message = 'Database connection error. Please try again later.';
        error.statusCode = 503;
    }

    // Timeout error
    if (err.name === 'MongoTimeoutError') {
        error.message = 'Database operation timed out. Please try again.';
        error.statusCode = 504;
    }

    // Write conflict
    if (err.code === 112) {
        error.message = 'Write conflict. Please try again.';
        error.statusCode = 409;
    }

    return error;
};

// @desc    Handle common HTTP errors
const httpError = (res, statusCode, message) => {
    const statusMessages = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        409: 'Conflict',
        422: 'Unprocessable Entity',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout'
    };

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message: message || statusMessages[statusCode] || 'Error',
        timestamp: new Date().toISOString()
    });
};

// @desc    Success response helper
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

// @desc    Pagination response helper
const paginateResponse = (res, data, total, page, limit, message = 'Success') => {
    const totalPages = Math.ceil(total / limit);
    
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        },
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    errorHandler,
    notFound,
    validationErrorHandler,
    asyncHandler,
    AppError,
    handleDatabaseError,
    httpError,
    successResponse,
    paginateResponse
};