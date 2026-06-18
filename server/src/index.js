const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const authRoutes = require('./routes/auth.routes');
const roomRoutes = require('./routes/room.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');
const globalErrorHandler = require('./middleware/error.middleware');
const websocketService = require('./services/websocket.service');

// Allow your app to understand .env variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
websocketService.initialize(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Room Booking System API');
});

// Fallback for unhandled routes
app.all('*', (req, res, next) => {
    const { NotFoundError } = require('./utils/errors');
    next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

// Centralized error handling middleware
app.use(globalErrorHandler);

const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});