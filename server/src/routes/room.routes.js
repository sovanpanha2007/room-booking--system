const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const roomController = require('../controllers/room.controller');

const router = express.Router();

router.use(protect);
router.get('/',roomController.getAllRooms);
router.post('/',restrictTo('ADMIN'), roomController.createRoom);
router.put('/:id',restrictTo('ADMIN'), roomController.updateRoom);
router.delete('/:id',restrictTo('ADMIN'), roomController.deleteRoom);


module.exports = router;