const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const prisma = require('../utils/prisma');

async function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new UnauthorizedError('No token provided or invalid authorization format. Use Bearer <token>'));
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return next(new UnauthorizedError('No token provided'));
        }

        let verified;
        try {
            verified = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return next(new UnauthorizedError('Invalid or expired token'));
        }

        // Fetch user from DB to verify they still exist and have the same role
        const user = await prisma.user.findUnique({
            where: { id: verified.userId }
        });

        if (!user) {
            return next(new UnauthorizedError('The user belonging to this token no longer exists'));
        }

        // Set req.user to standard verified object
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role // from DB (so it's always up-to-date, e.g. "USER" or "ADMIN")
        };

        next();
    } catch (error) {
        next(error);
    }
}

function restrictTo(...roles) {
    return function (req, res, next) {
        // Enforce role checks matching uppercase strings from DB
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ForbiddenError('You do not have permission to perform this action'));
        }
        next();
    };
}

module.exports = {
    protect,
    restrictTo
};