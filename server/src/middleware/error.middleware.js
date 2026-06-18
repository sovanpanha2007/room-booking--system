const { AppError } = require('../utils/errors');

function globalErrorHandler(err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error for internal tracking (senior standards)
    console.error(`[Error Log] Path: ${req.originalUrl} | Method: ${req.method}`);
    console.error(err.stack || err);

    const isDev = process.env.NODE_ENV === 'development';

    // Handle Prisma Specific Database Errors (standard mapping)
    if (err.code && err.code.startsWith('P')) {
        // P2002: Unique constraint failed
        if (err.code === 'P2002') {
            const field = err.meta && err.meta.target ? err.meta.target.join(', ') : 'field';
            err = new AppError(`A record with this ${field} already exists.`, 400);
        }
        // P2003: Foreign key constraint failed
        else if (err.code === 'P2003') {
            err = new AppError(`Related record not found (invalid ID reference).`, 400);
        }
        // P2025: Record to update not found
        else if (err.code === 'P2025') {
            err = new AppError(err.meta && err.meta.cause ? err.meta.cause : 'Record not found.', 404);
        }
    }

    if (err.isOperational) {
        // Operational, trusted error: send message to client
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            errors: err.errors || undefined,
            stack: isDev ? err.stack : undefined
        });
    }

    // Programming or other unknown error: don't leak error details to client in prod
    return res.status(err.statusCode).json({
        success: false,
        status: 'error',
        message: isDev ? err.message : 'Something went wrong on the server',
        stack: isDev ? err.stack : undefined
    });
}

module.exports = globalErrorHandler;
