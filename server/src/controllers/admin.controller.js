const adminService = require('../services/admin.service');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError } = require('../utils/errors');

const viewAllBookings = asyncHandler(async (req, res, next) => {
    const bookings = await adminService.viewAllBookings();
    res.status(200).json({ success: true, data: bookings });
});

const updateBookingStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW'];
    if (!status || !validStatuses.includes(status)) {
        throw new ValidationError(`Status is required and must be one of: ${validStatuses.join(', ')}`);
    }

    const updatedBooking = await adminService.updateBookingStatus(id, status);
    res.status(200).json({ success: true, data: updatedBooking });
});

module.exports = {
    viewAllBookings,
    updateBookingStatus
};