const bookingService = require('../services/booking.service');

async function createBooking(req, res) {
    const { roomId, startTime, endTime, passcode } = req.body;
    try {
        const userId = req.user.userId;
        const booking = await bookingService.createBooking(userId, roomId, startTime, endTime, passcode);
        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getMyBookings(req, res) {
    const userId = req.user.userId;
    try {
        const myBookings = await bookingService.getMyBookings(userId);
        res.status(200).json({ success: true, data: myBookings });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function updateBookingById(req, res) {
    const { id } = req.params;
    const { startTime, endTime, passcode } = req.body;
    try {
        const updatedBooking = await bookingService.updateBookingById(id, startTime, endTime, passcode);
        res.status(200).json({ success: true, data: updatedBooking });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function cancelBooking(req, res) {
    const { id } = req.params;
    const { passcode } = req.body;
    try {
        const cancelBooking = await bookingService.cancelBooking(id, passcode);
        res.status(200).json({ success: true, data: cancelBooking });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = { createBooking, getMyBookings, updateBookingById, cancelBooking };


