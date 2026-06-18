const prisma = require('../utils/prisma');
const { NotFoundError } = require('../utils/errors');
const websocketService = require('./websocket.service');

async function viewAllBookings() {
    // Return all bookings with relationships ordered by creation date
    return await prisma.booking.findMany({
        include: {
            room: true,
            user: {
                select: { id: true, name: true, email: true, role: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

async function updateBookingStatus(id, status) {
    const booking = await prisma.booking.findUnique({
        where: { id }
    });

    if (!booking) {
        throw new NotFoundError('Booking not found');
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status },
        include: {
            room: true,
            user: {
                select: { id: true, name: true, email: true, role: true }
            }
        }
    });

    // Broadcast live update over WebSockets
    websocketService.broadcast('booking_status_updated', updatedBooking);

    return updatedBooking;
}

module.exports = {
    viewAllBookings,
    updateBookingStatus
};