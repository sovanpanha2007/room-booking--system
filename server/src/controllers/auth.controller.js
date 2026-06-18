const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError, BadRequestError } = require('../utils/errors');

const register = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        throw new ValidationError('Name, email, and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
    }

    if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
    }

    const result = await authService.register(name, email, password);
    res.status(201).json({ success: true, data: result });
});

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new BadRequestError('Email and password are required');
    }

    const result = await authService.login(email, password);
    res.status(200).json({ success: true, data: result });
});

module.exports = { register, login };