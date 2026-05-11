const prisma = require('../utils/prisma.js')


async function getAllRooms() {
    return await prisma.room.findMany({ where: { isActive: true } });
}

async function createRoom(roomNumber, name, capacity, location) {
    const existingRoom = await prisma.room.findFirst({ where: { roomNumber } });
    if (existingRoom) {
        throw Error('Room already exists');
    }
    const newRoom = await prisma.room.create({
        data: {
            roomNumber,
            name,
            capacity,
            location
        }
    });
    return newRoom;
}

async function updateRoom(id, roomNumber, name, capacity, location) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
        throw Error('Room not found');
    }
    const updatedRoom = await prisma.room.update({
        where: { id }, data: {
            roomNumber,
            name,
            capacity,
            location
        }
    });
    return updatedRoom;
}
async function deleteRoom(id) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
        throw Error('Room not found');
    }
    const deletedRoom = await prisma.room.update({ where: { id }, data: { isActive: false } });
    return deletedRoom;
}

module.exports = { getAllRooms, createRoom, updateRoom, deleteRoom };