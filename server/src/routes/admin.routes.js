const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

router.use(protect);
router.get('/bookings', restrictTo('ADMIN'), adminController.viewAllBookings);
router.put('/bookings/:id', restrictTo('ADMIN'), adminController.updateBookingStatus);

module.exports = router;