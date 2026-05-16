const prisma = require('../utils/prisma.js')
const { sendEmail } = require('../utils/email.js');
const bcrypt = require('bcryptjs');

async function detectConflict(roomId, startTime, endTime) {
    const existingRoom = await prisma.booking.findFirst({
        where: {
            roomId,
            status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
            startTime: { lt: endTime },
            endTime: { gt: startTime }
        }
    });
    return existingRoom;
}

async function createBooking(userId, roomId, startTime, endTime, passcode) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) {
        throw Error('Room not found');
    }
    const conflict = await detectConflict(roomId, startTime, endTime);
    if (conflict) {
        throw Error('Room is already booked')
    }
    const passcodeHash = await bcrypt.hash(passcode, 10);
    const booking = await prisma.booking.create({
        data: {
            userId,
            roomId,
            startTime,
            endTime,
            status: "PENDING",
            passcodeHash: passcodeHash
        }
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await sendEmail(user.email, booking);
    return booking;
}

async function getMyBookings(userId) {
    const myBookingRoom = await prisma.booking.findMany({ where: { userId: userId }, include: { room: true } }); // include: {room: true} to get the room details
    return myBookingRoom;
}

async function updateBookingById(id, startTime, endTime, passcode) {
    const bookingRoom = await prisma.booking.findUnique({ where: { id: id } });
    if (!bookingRoom) {
        throw Error('Booking not found');
    }
    if (bookingRoom.status !== "PENDING") {
        throw Error('Booking can only modify if it is pending');
    }
    const verifyPasscode = await bcrypt.compare(passcode, bookingRoom.passcodeHash);
    if (!verifyPasscode) {
        throw Error('Invalid passcode');
    }
    const updatedBookingRoom = await prisma.booking.update({
        where: { id: id },
        data: {
            startTime: startTime,
            endTime: endTime,
        }
    });
    return updatedBookingRoom;
}
async function cancelBooking(id, passcode) {
    const bookingRoom = await prisma.booking.findUnique({ where: { id: id } });
    if (!bookingRoom) {
        throw Error('Booking not found');
    }
    if (bookingRoom.status !== "PENDING") {
        throw Error('Booking is not pending');
    }
    const verifyPasscode = await bcrypt.compare(passcode, bookingRoom.passcodeHash);
    if (!verifyPasscode) {
        throw Error('Invalid passcode');
    }
    const updatedBookingRoom = await prisma.booking.update({
        where: { id: id },
        data: {
            status: "CANCELLED"
        }
    });
    return updatedBookingRoom;
}
module.exports = { createBooking, getMyBookings, updateBookingById, cancelBooking }
