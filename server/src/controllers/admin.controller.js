const adminService = require('../services/admin.service')


async function viewAllBookings(req,res) {
    try {
        const bookings = await adminService.viewAllBookings();
        res.status(200).json({success: true, data: bookings});
    } catch(error) {
        res.status(400).json({success: false, message: error.message});
    }
}

async function updateBookingStatus(req,res) {
    const {id} = req.params;
    const {status} = req.body;
    try {
        const updatedBooking = await adminService.updateBookingStatus(id, status);
        res.status(200).json({success: true, data: updatedBooking});
    } catch(error) {
        res.status(400).json({success: false, message: error.message});
    }
}

module.exports = {viewAllBookings, updateBookingStatus};