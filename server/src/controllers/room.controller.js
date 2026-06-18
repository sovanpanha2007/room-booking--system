const roomService = require("../services/room.service");
const asyncHandler = require("../utils/asyncHandler");
const { ValidationError } = require("../utils/errors");

const getAllRooms = asyncHandler(async (req, res, next) => {
    const rooms = await roomService.getAllRooms();
    res.status(200).json({ success: true, data: rooms });
});

const createRoom = asyncHandler(async (req, res, next) => {
    const { roomNumber, name, capacity, location } = req.body;

    // Validation
    if (!roomNumber || !name || capacity === undefined || !location) {
        throw new ValidationError('roomNumber, name, capacity, and location are required');
    }

    const parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
        throw new ValidationError('Capacity must be a positive integer');
    }

    const newRoom = await roomService.createRoom(roomNumber, name, parsedCapacity, location);
    res.status(201).json({ success: true, data: newRoom });
});

const updateRoom = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { roomNumber, name, capacity, location } = req.body;

    // Validation
    if (!roomNumber && !name && capacity === undefined && !location) {
        throw new ValidationError('At least one field (roomNumber, name, capacity, location) must be provided for update');
    }

    let parsedCapacity;
    if (capacity !== undefined) {
        parsedCapacity = parseInt(capacity, 10);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            throw new ValidationError('Capacity must be a positive integer');
        }
    }

    const updatedRoom = await roomService.updateRoom(id, { roomNumber, name, capacity: parsedCapacity, location });
    res.status(200).json({ success: true, data: updatedRoom });
});

const deleteRoom = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const deletedRoom = await roomService.deleteRoom(id);
    res.status(200).json({ success: true, data: deletedRoom });
});

module.exports = { getAllRooms, createRoom, updateRoom, deleteRoom };