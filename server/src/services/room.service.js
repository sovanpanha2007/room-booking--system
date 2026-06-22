const prisma = require('../utils/prisma.js');
const { ConflictError, NotFoundError } = require('../utils/errors');
const websocketService = require('./websocket.service');

async function getAllRooms(showAll = false) {
    const filter = showAll ? {} : { isActive: true };
    return await prisma.room.findMany({
        where: filter,
        orderBy: { roomNumber: 'asc' }
    });
}

async function createRoom(roomNumber, name, capacity, location) {
    const existingRoom = await prisma.room.findFirst({
        where: { roomNumber, isActive: true }
    });

    if (existingRoom) {
        throw new ConflictError(`Room number ${roomNumber} already exists`);
    }

    // In case there is an inactive room with the same number, we can re-activate or delete it,
    // but Prisma unique constraint is on roomNumber. If soft deleted room still has roomNumber,
    // we should update it or handle unique index. Let's check schema.prisma:
    // roomNumber is @unique.
    // If a room is soft-deleted (isActive = false), the roomNumber unique constraint will still fail if we try to create another one with the same number.
    // A senior developer would handle this: either reactivate the existing room, or update it.
    // Let's find any room (active or inactive) with this roomNumber.
    const duplicateRoom = await prisma.room.findUnique({
        where: { roomNumber }
    });

    let newRoom;
    if (duplicateRoom) {
        if (!duplicateRoom.isActive) {
            // Reactivate and update the soft-deleted room
            newRoom = await prisma.room.update({
                where: { id: duplicateRoom.id },
                data: {
                    name,
                    capacity,
                    location,
                    isActive: true
                }
            });
        } else {
            throw new ConflictError(`Room number ${roomNumber} already exists`);
        }
    } else {
        newRoom = await prisma.room.create({
            data: {
                roomNumber,
                name,
                capacity,
                location
            }
        });
    }

    websocketService.broadcast('room_created', newRoom);
    return newRoom;
}

async function updateRoom(id, updateData) {
    const room = await prisma.room.findUnique({
        where: { id }
    });

    if (!room) {
        throw new NotFoundError('Room not found');
    }

    // Check unique room number conflict if it's being changed
    if (updateData.roomNumber && updateData.roomNumber !== room.roomNumber) {
        const existingRoom = await prisma.room.findFirst({
            where: { roomNumber: updateData.roomNumber }
        });
        if (existingRoom) {
            throw new ConflictError(`Room number ${updateData.roomNumber} is already taken`);
        }
    }

    // Filter out undefined fields for clean patch/update
    const cleanData = {};
    Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
            cleanData[key] = updateData[key];
        }
    });

    const updatedRoom = await prisma.room.update({
        where: { id },
        data: cleanData
    });

    // If room is updated to isActive = false, cancel all future pending/confirmed bookings for it
    if (cleanData.isActive === false) {
        await prisma.booking.updateMany({
            where: {
                roomId: id,
                status: { in: ['PENDING', 'CONFIRMED'] },
                startTime: { gte: new Date() }
            },
            data: {
                status: 'CANCELLED'
            }
        });
    }

    websocketService.broadcast('room_updated', updatedRoom);
    return updatedRoom;
}

async function deleteRoom(id) {
    const room = await prisma.room.findUnique({
        where: { id }
    });

    if (!room || !room.isActive) {
        throw new NotFoundError('Room not found');
    }

    // Soft delete: set isActive to false
    const deletedRoom = await prisma.room.update({
        where: { id },
        data: { isActive: false }
    });

    // Cancel all future pending/confirmed bookings for this room automatically (senior standard business rules)
    await prisma.booking.updateMany({
        where: {
            roomId: id,
            status: { in: ['PENDING', 'CONFIRMED'] },
            startTime: { gte: new Date() }
        },
        data: {
            status: 'CANCELLED'
        }
    });

    websocketService.broadcast('room_deleted', { id });
    return deletedRoom;
}

module.exports = { getAllRooms, createRoom, updateRoom, deleteRoom };