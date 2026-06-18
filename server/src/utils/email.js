const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT == 465, // True for port 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail(to, booking, passcode) {
    const formattedStart = new Date(booking.startTime).toLocaleString();
    const formattedEnd = new Date(booking.endTime).toLocaleString();
    const roomDetails = booking.room 
        ? `${booking.room.name} (Room ${booking.room.roomNumber})` 
        : `Room ${booking.roomId}`;

    await transporter.sendMail({
        from: `"Room Booking System" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `Room Booking Confirmation - ${booking.room ? booking.room.name : 'Success'}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #333; border-bottom: 2px solid #0056b3; padding-bottom: 10px;">Booking Confirmation</h2>
            <p>Hello,</p>
            <p>Your room booking has been successfully registered. Details are below:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                    <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; width: 30%;">Booking ID:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Room:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${roomDetails}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Start Time:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${formattedStart}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">End Time:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${formattedEnd}</td>
                </tr>
            </table>

            <div style="margin-top: 25px; padding: 15px; background-color: #f0f8ff; border: 1px dashed #0056b3; border-radius: 4px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #555;">Use the following passcode to modify, cancel, or check-in to your booking:</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #0056b3; letter-spacing: 2px;">${passcode}</p>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #777;">Please arrive at least 5 minutes before your scheduled start time. You can check in starting 15 minutes prior to start time.</p>
        </div>
        `
    });
}

module.exports = { sendEmail };