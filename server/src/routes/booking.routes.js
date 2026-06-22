const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');
const router = express.Router();

router.use(protect);

router.post('/', restrictTo('ADMIN', 'USER'), bookingController.createBooking);
router.get('/', restrictTo('ADMIN', 'USER'), bookingController.getBookings);
router.put('/:id', restrictTo('ADMIN', 'USER'), bookingController.updateBookingById);
router.put('/:id/cancel', restrictTo('ADMIN', 'USER'), bookingController.cancelBooking);
router.post('/:id/check-in', restrictTo('ADMIN', 'USER'), bookingController.checkInBooking);
router.post('/:id/recheck-passcode', restrictTo('ADMIN', 'USER'), bookingController.recheckPasscode);

module.exports = router;
