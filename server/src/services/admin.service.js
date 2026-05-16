const prisma = require('../utils/prisma');

async function viewAllBookings() {
    const bookings = await prisma.booking.findMany({include : {room : true, user : true}});
    return bookings;
}

async function updateBookingStatus(id, status) {
    const booking = await prisma.booking.findUnique({where : {id : id}});
    if(!booking) {
        throw Error('Booking not found');
    }
    const updatedBooking = await prisma.booking.update({
        where : {id : id},
        data : {status : status}
    });
    return updatedBooking;
}

module.exports = {viewAllBookings, updateBookingStatus}