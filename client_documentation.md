# Room Booking System - Frontend Client Documentation

This document provides details on the React + Vite single-page application (SPA) implemented inside the `client/` directory, highlighting the design system, page structures, real-time synchronization, and setup instructions.

---

## 🎨 Design System & Aesthetics

The client UI is built with a premium **glassmorphic design** optimized for both light and dark display preferences.
* **Colors**: A vibrant indigo-accented theme (`#6366f1`) paired with clean semantically-colored indicators (emerald for success, crimson for warnings, cyan for check-ins).
* **Glassmorphism**: Backdrop blur filters, micro-shadows, and ultra-fine card borders provide deep layer dynamics.
* **Micro-Animations**: Custom CSS transforms create springy button pushes, sliding toast alerts, and fade-in container listings.
* **Icons**: Fully integrated with the standard React `lucide-react` library.

---

## 📑 Core Views & Features

The client is structure-mapped as a modular state-driven Single Page Application:

### 1. Unified Authentication Gate
* Features a secure Login/Registration panel with client-side form validation.
* **Developer Shortcuts**: Includes one-click autofill options for the default seeded profiles:
  * **Admin Profile**: `admin@rms.com` / `admin123`
  * **Standard User Profile**: `user@rms.com` / `user123`

### 2. User Dashboard
* **Available Rooms Tab**: Renders responsive card grids detailing room names, numbers, seat capacity, locations, and active badges. Includes a conflict-validated reserving modal.
* **My Bookings Tab**: Tracks active reservations made by the authenticated user.
  * Shows status progression badges (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `CANCELLED`).
  * Triggers check-in validations and cancellation forms.
  * **Passcode PIN Display**: Populates a secure success screen immediately after booking, showing the check-in passcode.

### 3. Administrator Console (Authorized Roles Only)
* **All Bookings Logs**: Central log table for checking every booking in the database. Includes dropdown inputs for manual, real-time override status updates.
* **Room Settings**: Active listings tracker that lets admins define and add new rooms (validating unique numbers and locations) or deactivate current workspaces (cascading auto-cancellations to all future bookings).

---

## ⚡ WebSocket Live Broadcast Sync

The frontend app opens a persistent connection to `ws://localhost:5001` upon user login.

* **Live Toast Alerts**: Slide-in notification cards appear in the corner when another user or administrator reserves a room, checks in, or updates a status.
* **Automatic Data Hydration**: The app patches local component state in real-time when WebSocket events arrive, meaning room listings and reservation logs update instantly without requiring manual browser refreshes.

---

## 🚀 How to Execute Commands

Navigate to the `client/` directory:

```bash
cd client
```

### 1. Install Packages
Installs React, Vite, and Lucide Icons:
```bash
npm install
```

### 2. Launch Development Server
Starts the local development watcher (usually running on `http://localhost:5173`):
```bash
npm run dev
```

### 3. Compile Production Bundle
Builds optimized, compressed HTML/JS/CSS assets to the `/dist` output folder:
```bash
npm run build
```
