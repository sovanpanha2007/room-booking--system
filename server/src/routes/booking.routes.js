const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');
const router = express.Router();

router.post('/', protect,restrictTo('ADMIN','USER'), bookingController.createBooking);
router.get('/', protect,restrictTo('ADMIN','USER'), bookingController.getMyBookings);
router.put('/:id', protect,restrictTo('ADMIN','USER'), bookingController.updateBookingById);
router.put('/:id/cancel', protect,restrictTo('ADMIN','USER'), bookingController.cancelBooking);

module.exports = router;
