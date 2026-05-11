const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const roomController = require('../controllers/room.controller');

const router = express.Router();

router.get('/',protect, roomController.getAllRooms);
router.post('/',protect, roomController.createRoom);
router.put('/:id',protect, roomController.updateRoom);
router.delete('/:id',protect, roomController.deleteRoom);

module.exports = router;