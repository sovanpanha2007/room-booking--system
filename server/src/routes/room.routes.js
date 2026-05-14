const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const roomController = require('../controllers/room.controller');

const router = express.Router();

router.get('/',protect,roomController.getAllRooms);
router.post('/',protect,restrictTo('ADMIN'), roomController.createRoom);
router.put('/:id',protect,restrictTo('ADMIN'), roomController.updateRoom);
router.delete('/:id',protect,restrictTo('ADMIN'), roomController.deleteRoom);

module.exports = router;