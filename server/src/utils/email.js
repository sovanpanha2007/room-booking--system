const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail(to, booking) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Booking Confirmation',
        html: `
        <h1>Booking Confirmation</h1>
        <p>Your booking is confirmed</p>
        <p>Booking ID: ${booking.id}</p>
        <p>Room ID: ${booking.roomId}</p>
        <p>Start Time: ${booking.startTime}</p>
        <p>End Time: ${booking.endTime}</p>
        `
    });
}

module.exports = { sendEmail };