const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');
const router = express.Router();

router.post('/', protect, bookingController.createBooking);
router.get('/', protect, bookingController.getMyBookings);
router.put('/:id', protect, bookingController.updateBookingById);
router.put('/:id/cancel', protect, bookingController.cancelBooking);

module.exports = router;
