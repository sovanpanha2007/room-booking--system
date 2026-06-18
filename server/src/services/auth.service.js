const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ConflictError, UnauthorizedError } = require('../utils/errors');

async function register(name, email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    return { userId: newUser.id, email: newUser.email, role: newUser.role };
}

async function login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' } // Expanded to 1 day for standard user experience, customizable
    );

    return {
        token,
        user: { id: user.id, email: user.email, role: user.role, name: user.name }
    };
}

module.exports = { register, login };