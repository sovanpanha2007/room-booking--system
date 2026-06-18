# Room Booking System - Backend Documentation

This document provides a comprehensive overview of the backend structure, security features, validation logic, API endpoints, WebSocket protocol, and setup procedures implemented in the `server/` directory.

---

## 📂 Project Directory Structure

The backend application is structured following clean coding patterns, separating routing, HTTP controller handling, core business services, and database schemas.

```text
server/
├── prisma/
│   ├── migrations/            # SQL migration history
│   ├── schema.prisma          # Database schema models
│   └── seed.js                # Idempotent database seeding script
├── src/
│   ├── controllers/           # HTTP Request/Response handling
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js
│   │   └── room.controller.js
│   ├── middleware/            # Express custom middleware
│   │   ├── auth.middleware.js # Auth/Protect & Restrict routes
│   │   └── error.middleware.js# Centralized global error handling
│   ├── routes/                # Express API Route definitions
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   └── room.routes.js
│   ├── services/              # Core business services & DB transactions
│   │   ├── admin.service.js
│   │   ├── auth.service.js
│   │   ├── booking.service.js
│   │   ├── room.service.js
│   │   └── websocket.service.js
│   ├── utils/                 # Utility files
│   │   ├── asyncHandler.js    # Unhandled async errors wrapper
│   │   ├── email.js           # SMTP email setup and templates
│   │   ├── errors.js          # API custom operational errors hierarchy
│   │   └── prisma.js          # Shared Prisma database connection
│   └── index.js               # Application server bootstrap (HTTP & WebSockets)
├── .env                       # App configuration and credentials
├── package.json               # Scripts and dependencies
└── package-lock.json
```

---

## 🛠️ Design Patterns & Senior Implementations

### 1. Robust Centralized Error Handling
* **Custom Error Tree ([errors.js](file:///home/panha/Projects/room-booking--system/server/src/utils/errors.js))**: Defined custom operational error classes extending the native `Error` class to support descriptive status codes and metadata:
  * `AppError` (Base operational error class)
  * `BadRequestError` / `ValidationError` (400)
  * `UnauthorizedError` (401)
  * `ForbiddenError` (403)
  * `NotFoundError` (404)
  * `ConflictError` (409)
* **Express Async Wrapper ([asyncHandler.js](file:///home/panha/Projects/room-booking--system/server/src/utils/asyncHandler.js))**: Created a higher-order utility function to wrap async controller middlewares. This eliminates the need for redundant `try/catch` boilerplate, passing errors directly to `next()`.
* **Global Error Middleware ([error.middleware.js](file:///home/panha/Projects/room-booking--system/server/src/middleware/error.middleware.js))**: Installed at the end of the middleware chain to format errors uniformly. It also handles mapping native database errors (such as Prisma's unique constraints or foreign key failures) into user-facing HTTP messages without leaking technical stack information in production.

### 2. Strict Input & Date Validation
* All controllers validate inputs before invoking underlying service layers:
  * Emails are filtered against formatting regular expressions.
  * Room capacities are verified to be positive, non-zero integers.
  * Start and end times are validated as valid ISO Date strings.
  * Start times are prevented from being booked in the past.
  * End times are validated to follow start times chronologically.
  * Allowed check-in windows are strictly checked (restricted to starting at most 15 minutes before the booking start time, up until the booking end time).

### 3. Comprehensive Security Controls
* **Active Token Expiry Check ([auth.middleware.js](file:///home/panha/Projects/room-booking--system/server/src/middleware/auth.middleware.js))**: Verifies the signature of incoming JWT headers. It checks the database directly to confirm the user still exists and pulls their active role.
* **Ownership Verification**: Standard users (`USER` role) can only view, update, cancel, or check-in to bookings that they originally created.
* **Admin Privilege Bypass**: Users possessing the `ADMIN` role bypass passcode checking on bookings and can cancel, update, or check-in to bookings without needing to input a passcode.

### 4. Overlap & Conflict Protection
* **Conflict Checking**: The conflict detection engine checks for active, overlapping bookings (states: `PENDING`, `CONFIRMED`, `CHECKED_IN`) using boundary checks (`startTime < proposedEndTime && endTime > proposedStartTime`).
* **Update Exclusion**: The conflict detector supports an optional exclusion ID (`excludeBookingId`) during booking updates to prevent a booking from conflicting with itself.

### 5. Cascade soft-deletion logic
* Deleting a room marks the room database field `isActive` to `false` (soft delete) to preserve historical data.
* A senior service listener automatically cancels all pending and confirmed future bookings associated with that soft-deleted room to prevent dead states.

### 6. Graceful SMTP Integration
* Email dispatch operations in `createBooking` are executed in a safe `try/catch` block. If the SMTP transporter experiences connection timeouts or credential validation problems, the transaction completes successfully and prints a console warning rather than aborting database bookings.

### 7. Real-Time WebSockets
* Integrated a WebSocket Server (`ws`) inside the core Node HTTP listener in `index.js`.
* Broadcasts server events live to all active subscribers, providing clean, instant syncs for real-time client dashboards.

---

## 🛢️ Database Schema & Seeding

### 1. Database Configuration
The local Postgres database setup is defined inside the [.env](file:///home/panha/Projects/room-booking--system/server/.env) file:
```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/rms_db"
JWT_SECRET="<your-secret-jwt-key>"
EMAIL_HOST="<smtp-host>"
EMAIL_PORT=587
EMAIL_USER="<smtp-username>"
EMAIL_PASS="<smtp-password>"
PORT=5001
```

### 2. Idempotent Data Seeding
Seeding utilizes Prisma `upsert` queries to make successive seeding runs safe and idempotent.
* **Seeded Accounts**:
  * **Admin**: `admin@rms.com` (Password: `<admin-password-set-in-seed.js>`)
  * **Standard User**: `user@rms.com` (Password: `<user-password-set-in-seed.js>`)
* **Seeded Rooms**:
  * Room 101: `Conference Room A` (Capacity: 10, Location: 1st Floor, Wing A)
  * Room 102: `Board Room B` (Capacity: 6, Location: 1st Floor, Wing B)
  * Room 201: `Training Center C` (Capacity: 25, Location: 2nd Floor, Main Hall)
  * Room 301: `Executive Suite D` (Capacity: 4, Location: 3rd Floor, Penthouse)

---

## 📡 API Endpoints

### 1. Authentication Endpoints (`/api/auth`)

* **`POST /register`**: Registers a new user.
  * **Body**: `{ "name": "Name", "email": "user@test.com", "password": "securepassword" }`
  * **Response**: `201 Created` with `{ "success": true, "data": { "userId": "uuid", "email": "user@test.com", "role": "USER" } }`
* **`POST /login`**: Logs in an existing user and returns a token.
  * **Body**: `{ "email": "user@test.com", "password": "securepassword" }`
  * **Response**: `200 OK` with `{ "success": true, "data": { "token": "jwt-token", "user": { "id": "uuid", "email": "user@test.com", "role": "USER", "name": "Name" } } }`

---

### 2. Room Endpoints (`/api/rooms`)
*(All room endpoints require a valid header: `Authorization: Bearer <token>`)*

* **`GET /`**: Returns a list of active rooms.
  * **Access**: Admin & User
  * **Response**: `200 OK` with an array of room objects.
* **`POST /`**: Creates a new room (or reactivates an inactive soft-deleted room).
  * **Access**: Admin only
  * **Body**: `{ "roomNumber": "104", "name": "Collab Space E", "capacity": 8, "location": "2nd Floor" }`
  * **Response**: `201 Created` with the room object.
* **`PUT /:id`**: Modifies an existing room.
  * **Access**: Admin only
  * **Body**: `{ "name": "New Name", "capacity": 12 }` (Accepts partial fields)
  * **Response**: `200 OK` with the updated room object.
* **`DELETE /:id`**: Soft-deletes a room and automatically cancels future bookings.
  * **Access**: Admin only
  * **Response**: `200 OK` with the deleted room object.

---

### 3. Booking Endpoints (`/api/bookings`)
*(All booking endpoints require a valid header: `Authorization: Bearer <token>`)*

* **`GET /`**: Fetches bookings.
  * **Access**: Admin (returns all bookings in the system), User (returns only the user's bookings)
  * **Response**: `200 OK` with an array of booking objects.
* **`POST /`**: Creates a booking. Generates a random 6-digit passcode if not provided. Sends confirmation email.
  * **Access**: Admin & User
  * **Body**: `{ "roomId": "room-uuid", "startTime": "2026-06-25T10:00:00Z", "endTime": "2026-06-25T11:00:00Z", "passcode": "optional-code" }`
  * **Response**: `201 Created` with booking details and the raw `passcode` PIN.
* **`PUT /:id`**: Updates booking start/end times.
  * **Access**: Admin (no passcode required), User (passcode required in body)
  * **Body**: `{ "startTime": "new-time", "endTime": "new-time", "passcode": "booking-passcode" }`
  * **Response**: `200 OK` with the updated booking object.
* **`PUT /:id/cancel`**: Cancels a pending or confirmed booking.
  * **Access**: Admin (no passcode required), User (passcode required in body)
  * **Body**: `{ "passcode": "booking-passcode" }`
  * **Response**: `200 OK` with the updated booking status set to `CANCELLED`.
* **`POST /:id/check-in`**: Checks into a booking. Must be within the booking timeframe.
  * **Access**: Admin (no passcode required), User (passcode required in body)
  * **Body**: `{ "passcode": "booking-passcode" }`
  * **Response**: `200 OK` with booking status set to `CHECKED_IN`.

---

### 4. Admin Management Endpoints (`/api/admin`)
*(All admin endpoints require an admin token: `Authorization: Bearer <admin-token>`)*

* **`GET /bookings`**: Fetches all bookings in the system with associated rooms and users.
  * **Response**: `200 OK`
* **`PUT /bookings/:id`**: Forcefully updates a booking's status.
  * **Body**: `{ "status": "CONFIRMED" }` (Valid statuses: `PENDING`, `CONFIRMED`, `CANCELLED`, `CHECKED_IN`, `NO_SHOW`)
  * **Response**: `200 OK`

---

## ⚡ WebSocket Live Protocol

Clients can listen to WebSocket events on `ws://localhost:5001` to synchronize their user interface instantly.

### Broadcaster Events
When actions occur, the server broadcasts JSON messages containing the event type and the modified database row:

| Broadcast Event | Trigger action | Payload details |
| :--- | :--- | :--- |
| `room_created` | Room created or reactivated | Room database object |
| `room_updated` | Room details edited | Room database object |
| `room_deleted` | Room soft-deleted | `{ id: "deleted-room-uuid" }` |
| `booking_created` | Booking successfully created | Booking object with room relation |
| `booking_updated` | Booking dates updated | Booking object with room relation |
| `booking_cancelled` | Booking cancelled by owner/admin | Booking object with room relation |
| `booking_checked_in` | User checked into physical room | Booking object with room relation |
| `booking_status_updated`| Admin updated status manually | Booking object with room and user |

---

## 🚀 How to Execute Commands

Navigate to the `server/` directory:

```bash
cd server
```

### 1. Database Migrations
Deploy existing migrations to database:
```bash
npx prisma migrate deploy
```

Create database schemas / synchronize models during development:
```bash
npx prisma migrate dev --name <migration_name>
```

### 2. Database Seeding
Seed initial accounts and rooms:
```bash
npm run db:seed
```

### 3. Launch the Application
Run the production Node server:
```bash
npm start
```

Run the development Nodemon watcher:
```bash
npm run dev
```
