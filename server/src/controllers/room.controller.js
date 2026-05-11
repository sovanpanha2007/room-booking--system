const roomService = require("../services/room.service")

async function getAllRooms(req,res) {
    try {
        const rooms = await roomService.getAllRooms();
        res.status(200).json({success: true, data: rooms});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};
async function createRoom(req, res) {
    const {roomNumber, name, capacity, location} = req.body;
    try {
        const newRoom = await roomService.createRoom(roomNumber, name, capacity, location);
        res.status(201).json({success: true, data: newRoom});
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
};
async function updateRoom(req,res){
    const {id} = req.params;
    const {roomNumber, name, capacity, location} = req.body;
    try {
        const updatedRoom = await roomService.updateRoom(id, roomNumber, name, capacity, location);
        res.status(200).json({success: true, data: updatedRoom});
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
};
async function deleteRoom(req,res){
    const {id} = req.params;
    try {
        const deletedRoom = await roomService.deleteRoom(id);
        res.status(200).json({success: true, data: deletedRoom});
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
};

module.exports = {getAllRooms, createRoom, updateRoom, deleteRoom};