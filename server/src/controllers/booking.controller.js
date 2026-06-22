const bookingService = require('../services/booking.service');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError } = require('../utils/errors');

const createBooking = asyncHandler(async (req, res, next) => {
    const { roomId, startTime, endTime, passcode, userEmail } = req.body;
    const { userId, role } = req.user;

    // Validate presence
    if (!roomId || !startTime || !endTime) {
        throw new ValidationError('roomId, startTime, and endTime are required');
    }

    // Validate date objects
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError('startTime and endTime must be valid ISO Date strings');
    }

    if (start >= end) {
        throw new ValidationError('endTime must be after startTime');
    }

    const now = new Date();
    if (start < now) {
        throw new ValidationError('startTime cannot be in the past');
    }

    // Call service to create booking
    const { booking, rawPasscode } = await bookingService.createBooking({
        userId,
        role,
        roomId,
        startTime: start,
        endTime: end,
        passcode,
        userEmail
    });

    res.status(201).json({
        success: true,
        data: {
            ...booking,
            // Expose the raw passcode to the user on creation so they know it if it was auto-generated
            passcode: rawPasscode
        }
    });
});

const getBookings = asyncHandler(async (req, res, next) => {
    const { userId, role } = req.user;
    const bookings = await bookingService.getBookings(userId, role);
    res.status(200).json({ success: true, data: bookings });
});

const updateBookingById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { startTime, endTime, passcode } = req.body;
    const { userId, role } = req.user;

    if (!startTime || !endTime) {
        throw new ValidationError('startTime and endTime are required for update');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError('startTime and endTime must be valid ISO Date strings');
    }

    if (start >= end) {
        throw new ValidationError('endTime must be after startTime');
    }

    const updatedBooking = await bookingService.updateBookingById({
        id,
        startTime: start,
        endTime: end,
        passcode,
        userId,
        role
    });

    res.status(200).json({ success: true, data: updatedBooking });
});

const cancelBooking = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { passcode } = req.body;
    const { userId, role } = req.user;

    const cancelledBooking = await bookingService.cancelBooking({
        id,
        passcode,
        userId,
        role
    });

    res.status(200).json({ success: true, data: cancelledBooking });
});

const checkInBooking = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { passcode } = req.body;
    const { userId, role } = req.user;

    if (!passcode && role !== 'ADMIN') {
        throw new ValidationError('Passcode is required for check-in');
    }

    const checkedInBooking = await bookingService.checkInBooking({
        id,
        passcode,
        userId,
        role
    });

    res.status(200).json({ success: true, data: checkedInBooking });
});

const recheckPasscode = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { password } = req.body;
    const { userId, role } = req.user;

    if (!password) {
        throw new ValidationError('Account password is required to recheck passcode');
    }

    const { booking, rawPasscode } = await bookingService.recheckPasscode({
        id,
        password,
        userId,
        role
    });

    res.status(200).json({
        success: true,
        data: {
            booking,
            passcode: rawPasscode
        }
    });
});

module.exports = {
    createBooking,
    getBookings,
    updateBookingById,
    cancelBooking,
    checkInBooking,
    recheckPasscode
};
