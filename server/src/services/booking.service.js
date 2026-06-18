const prisma = require('../utils/prisma.js');
const { sendEmail } = require('../utils/email.js');
const bcrypt = require('bcryptjs');
const { ConflictError, NotFoundError, ForbiddenError, UnauthorizedError, ValidationError, AppError } = require('../utils/errors');
const websocketService = require('./websocket.service');

async function detectConflict(roomId, startTime, endTime, excludeBookingId = null) {
    const conflictQuery = {
        roomId,
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime }
    };

    if (excludeBookingId) {
        conflictQuery.id = { not: excludeBookingId };
    }

    const existingBooking = await prisma.booking.findFirst({
        where: conflictQuery
    });

    return existingBooking;
}

async function createBooking({ userId, role, roomId, startTime, endTime, passcode, userEmail }) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) {
        throw new NotFoundError('Room not found or is currently inactive');
    }

    let targetUserId = userId;
    let targetUserEmail = null;

    if (role === 'ADMIN') {
        if (!userEmail) {
            throw new ValidationError('Administrators must specify a user email to book on behalf of');
        }
        const targetUser = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!targetUser) {
            throw new NotFoundError(`User with email "${userEmail}" not found`);
        }
        if (targetUser.id === userId) {
            throw new ForbiddenError('Administrators cannot book rooms for themselves. Please book on behalf of a standard user');
        }
        targetUserId = targetUser.id;
        targetUserEmail = targetUser.email;
    } else {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        targetUserEmail = user.email;
    }

    const conflict = await detectConflict(roomId, startTime, endTime);
    if (conflict) {
        throw new ConflictError('The room is already booked for the specified timeframe');
    }

    // Passcode logic: use provided passcode or auto-generate a 6-digit PIN
    const rawPasscode = passcode || Math.floor(100000 + Math.random() * 900000).toString();
    const passcodeHash = await bcrypt.hash(rawPasscode, 10);

    // Admins bypass PENDING confirmation state and book immediately in CONFIRMED state
    const initialStatus = role === 'ADMIN' ? 'CONFIRMED' : 'PENDING';

    const booking = await prisma.booking.create({
        data: {
            userId: targetUserId,
            roomId,
            startTime,
            endTime,
            status: initialStatus,
            passcodeHash: passcodeHash
        },
        include: {
            room: true
        }
    });

    // Graceful Email Notification (senior standard: don't crash booking if SMTP fails)
    try {
        await sendEmail(targetUserEmail, booking, rawPasscode);
    } catch (emailError) {
        console.error(`[Email Error] Failed to send confirmation email to ${targetUserEmail}:`, emailError.message);
    }

    // Broadcast booking creation live
    websocketService.broadcast('booking_created', booking);

    return { booking, rawPasscode };
}

async function getBookings(userId, role) {
    // Return only the bookings belonging to the requesting user (regardless of whether they are an Admin or a standard User)
    return await prisma.booking.findMany({
        where: { userId },
        include: { room: true },
        orderBy: { startTime: 'desc' }
    });
}

async function updateBookingById({ id, startTime, endTime, passcode, userId, role }) {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { room: true }
    });

    if (!booking) {
        throw new NotFoundError('Booking not found');
    }

    // Authorization: Must be owner or Admin
    if (booking.userId !== userId && role !== 'ADMIN') {
        throw new ForbiddenError('You are not authorized to modify this booking');
    }

    // Status restriction
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
        throw new AppError(`Cannot modify a booking that is ${booking.status.toLowerCase()}`, 400);
    }

    // Passcode validation (Bypassed if Admin)
    if (role !== 'ADMIN') {
        if (!passcode) {
            throw new UnauthorizedError('Passcode is required to modify this booking');
        }
        const verifyPasscode = await bcrypt.compare(passcode, booking.passcodeHash);
        if (!verifyPasscode) {
            throw new UnauthorizedError('Invalid passcode');
        }
    }

    // Conflict Check
    const conflict = await detectConflict(booking.roomId, startTime, endTime, id);
    if (conflict) {
        throw new ConflictError('The room is already booked for the updated timeframe');
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
            startTime,
            endTime
        },
        include: {
            room: true
        }
    });

    websocketService.broadcast('booking_updated', updatedBooking);
    return updatedBooking;
}

async function cancelBooking({ id, passcode, userId, role }) {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        throw new NotFoundError('Booking not found');
    }

    // Authorization: Must be owner or Admin
    if (booking.userId !== userId && role !== 'ADMIN') {
        throw new ForbiddenError('You are not authorized to cancel this booking');
    }

    // Check status: only pending or confirmed can be cancelled
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
        throw new AppError(`Cannot cancel a booking that is ${booking.status.toLowerCase()}`, 400);
    }

    // Standard users cannot cancel bookings after they have been confirmed
    if (role !== 'ADMIN' && booking.status === 'CONFIRMED') {
        throw new ForbiddenError('You cannot cancel this booking after it has been confirmed. Please contact an administrator.');
    }

    // Passcode check (Bypassed if Admin)
    if (role !== 'ADMIN') {
        if (!passcode) {
            throw new UnauthorizedError('Passcode is required to cancel this booking');
        }
        const verifyPasscode = await bcrypt.compare(passcode, booking.passcodeHash);
        if (!verifyPasscode) {
            throw new UnauthorizedError('Invalid passcode');
        }
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { room: true }
    });

    websocketService.broadcast('booking_cancelled', updatedBooking);
    return updatedBooking;
}

async function checkInBooking({ id, passcode, userId, role }) {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        throw new NotFoundError('Booking not found');
    }

    // Authorization: Must be owner or Admin
    if (booking.userId !== userId && role !== 'ADMIN') {
        throw new ForbiddenError('You are not authorized to check in to this booking');
    }

    // Check status: check-in is ONLY allowed for CONFIRMED bookings. PENDING/CANCELLED/NO_SHOW etc are blocked.
    if (booking.status !== 'CONFIRMED') {
        if (booking.status === 'CHECKED_IN') {
            throw new AppError('Booking is already checked in', 400);
        }
        if (booking.status === 'PENDING') {
            throw new AppError('Cannot check in. The booking must be confirmed by an administrator first.', 400);
        }
        throw new AppError(`Cannot check in to a booking that is ${booking.status.toLowerCase()}`, 400);
    }

    // Passcode validation (Bypassed if Admin)
    if (role !== 'ADMIN') {
        if (!passcode) {
            throw new UnauthorizedError('Passcode is required to check in');
        }
        const verifyPasscode = await bcrypt.compare(passcode, booking.passcodeHash);
        if (!verifyPasscode) {
            throw new UnauthorizedError('Invalid passcode');
        }
    }

    // Time window validation: check-in is strictly allowed within the duration (between start and end times)
    const now = new Date();
    if (now < booking.startTime) {
        throw new AppError('It is too early to check in. Check-in is only allowed within the booking duration', 400);
    }
    if (now > booking.endTime) {
        throw new AppError('The booking time window has expired. Check-in is no longer allowed', 400);
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status: 'CHECKED_IN' },
        include: { room: true }
    });

    websocketService.broadcast('booking_checked_in', updatedBooking);
    return updatedBooking;
}

module.exports = {
    createBooking,
    getBookings,
    updateBookingById,
    cancelBooking,
    checkInBooking
};
