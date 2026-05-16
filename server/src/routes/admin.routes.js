const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

router.get('/bookings', protect,restrictTo('ADMIN'), adminController.viewAllBookings);
router.put('/bookings/:id', protect,restrictTo('ADMIN'), adminController.updateBookingStatus);

module.exports = router;