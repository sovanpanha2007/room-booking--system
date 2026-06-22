import React from 'react';
import { RefreshCw, CheckCircle, Info } from 'lucide-react';

function Modals({
  activeModal,
  selectedRoom,
  selectedBooking,
  errorMessage,
  bookingStart,
  setBookingStart,
  bookingEnd,
  setBookingEnd,
  autoGenPasscode,
  setAutoGenPasscode,
  bookingPasscode,
  setBookingPasscode,
  bookingUserEmail,
  setBookingUserEmail,
  actionPasscode,
  setActionPasscode,
  roomNumber,
  setRoomNumber,
  roomName,
  setRoomName,
  roomCapacity,
  setRoomCapacity,
  roomLocation,
  setRoomLocation,
  roomActive,
  setRoomActive,
  accountPassword,
  setAccountPassword,
  createdBookingDetails,
  loading,
  user,
  setActiveModal,
  handleCreateBookingSubmit,
  handleCheckInSubmit,
  handleCancelBookingSubmit,
  handleCreateRoomSubmit,
  handleUpdateRoomSubmit,
  handleRecheckPasscodeSubmit
}) {
  if (!activeModal) return null;

  return (
    <div className="modal-overlay">
      
      {/* Modal A: Book Room Form */}
      {activeModal === 'book' && selectedRoom && (
        <div className="modal-content card glass-panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: 'var(--text-title)', marginBottom: '4px', textAlign: 'left' }}>
            Reserve Room: {selectedRoom.name}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'left', marginBottom: '20px' }}>
            Verify dates to prevent scheduling conflicts with other active sessions.
          </p>

          {errorMessage && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateBookingSubmit}>
            {user && user.role === 'ADMIN' && (
              <div className="input-group animate-fade-in">
                <label htmlFor="book-user-email">User Email Address (Book on behalf of)</label>
                <input 
                  type="email" 
                  id="book-user-email" 
                  className="input-field" 
                  placeholder="user@rms.com" 
                  value={bookingUserEmail}
                  onChange={(e) => setBookingUserEmail(e.target.value)}
                  required 
                />
              </div>
            )}
            <div className="input-group">
              <label htmlFor="book-start">Start Time</label>
              <input 
                type="datetime-local" 
                id="book-start" 
                className="input-field" 
                value={bookingStart}
                onChange={(e) => setBookingStart(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="book-end">End Time</label>
              <input 
                type="datetime-local" 
                id="book-end" 
                className="input-field" 
                value={bookingEnd}
                onChange={(e) => setBookingEnd(e.target.value)}
                required 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0', justifyContent: 'flex-start' }}>
              <input 
                type="checkbox" 
                id="auto-passcode" 
                checked={autoGenPasscode}
                onChange={(e) => setAutoGenPasscode(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="auto-passcode" style={{ fontSize: '13.5px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-title)' }}>
                Auto-generate security check-in passcode
              </label>
            </div>

            {!autoGenPasscode && (
              <div className="input-group animate-fade-in">
                <label htmlFor="book-passcode">Custom Passcode Pin</label>
                <input 
                  type="password" 
                  id="book-passcode" 
                  className="input-field" 
                  placeholder="e.g. 992211" 
                  value={bookingPasscode}
                  onChange={(e) => setBookingPasscode(e.target.value)}
                  required 
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Book Room'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal B: Check In Passcode Prompt */}
      {activeModal === 'checkin' && selectedBooking && (
        <div className="modal-content card glass-panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: 'var(--text-title)', marginBottom: '4px', textAlign: 'left' }}>
            Verify Check-In Passcode
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', textAlign: 'left', marginBottom: '20px' }}>
            Enter the passcode associated with your booking confirmation email to check in.
          </p>

          {errorMessage && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCheckInSubmit}>
            {user && user.role === 'ADMIN' ? (
              <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600, marginBottom: '20px', textAlign: 'left' }}>
                👑 Administrator authorization active. You can bypass the passcode by clicking Check-In below.
              </div>
            ) : (
              <div className="input-group">
                <label htmlFor="checkin-passcode">Passcode</label>
                <input 
                  type="password" 
                  id="checkin-passcode" 
                  className="input-field" 
                  placeholder="Enter passcode pin" 
                  value={actionPasscode}
                  onChange={(e) => setActionPasscode(e.target.value)}
                  required 
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Check In'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal C: Cancel Booking Passcode Prompt */}
      {activeModal === 'cancel' && selectedBooking && (
        <div className="modal-content card glass-panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: 'var(--text-title)', marginBottom: '4px', textAlign: 'left' }}>
            Cancel Reservation
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', textAlign: 'left', marginBottom: '20px' }}>
            Please provide the passcode configuration to securely delete this booking.
          </p>

          {errorMessage && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCancelBookingSubmit}>
            {user && user.role === 'ADMIN' ? (
              <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600, marginBottom: '20px', textAlign: 'left' }}>
                👑 Administrator authorization active. You can bypass the passcode override to cancel immediately.
              </div>
            ) : (
              <div className="input-group">
                <label htmlFor="cancel-passcode">Passcode PIN</label>
                <input 
                  type="password" 
                  id="cancel-passcode" 
                  className="input-field" 
                  placeholder="Enter passcode pin" 
                  value={actionPasscode}
                  onChange={(e) => setActionPasscode(e.target.value)}
                  required 
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                Back
              </button>
              <button type="submit" className="btn btn-danger" style={{ flex: 1 }} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Cancel Booking'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal D: Booking Success PIN display */}
      {activeModal === 'success_pin' && createdBookingDetails && (
        <div className="modal-content card glass-panel" style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            background: 'var(--success-light)', 
            color: 'var(--success)',
            marginBottom: '16px'
          }}>
            <CheckCircle size={28} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px', color: 'var(--text-title)', marginBottom: '8px' }}>
            {createdBookingDetails.isRecheck ? 'Passcode Retrieved!' : 'Booking Registered!'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
            {createdBookingDetails.isRecheck 
              ? 'Your identity has been verified. The passcode has been updated and a notification has been sent to your email.'
              : 'Your room has been reserved. A confirmation email has been queued.'}
          </p>

          <div style={{ 
            background: 'var(--info-light)', 
            border: '1px dashed var(--info)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-title)', fontWeight: 600, marginBottom: '6px' }}>
              🔑 SECURITY CHECK-IN PASSCODE PIN:
            </p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '4px', margin: 0 }}>
              {createdBookingDetails.passcode}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Please save this passcode. It is required to check in at the room or cancel.
            </p>
          </div>

          <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setActiveModal(null)}>
            Got it
          </button>
        </div>
      )}

      {/* Modal E: Admin Create Room Form */}
      {activeModal === 'room_create' && (
        <div className="modal-content card glass-panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: 'var(--text-title)', marginBottom: '4px', textAlign: 'left' }}>
            Add New Meeting Room
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', textAlign: 'left', marginBottom: '20px' }}>
            Provide structural specifications for the physical workspace.
          </p>

          {errorMessage && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateRoomSubmit}>
            <div className="input-group">
              <label htmlFor="room-num">Room Number (Unique)</label>
              <input 
                type="text" 
                id="room-num" 
                className="input-field" 
                placeholder="e.g. 402" 
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="room-name">Room Name</label>
              <input 
                type="text" 
                id="room-name" 
                className="input-field" 
                placeholder="e.g. Design Studio A" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="room-cap">Seating Capacity</label>
              <input 
                type="number" 
                id="room-cap" 
                className="input-field" 
                placeholder="e.g. 12" 
                min="1"
                value={roomCapacity}
                onChange={(e) => setRoomCapacity(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="room-loc">Building Location</label>
              <input 
                type="text" 
                id="room-loc" 
                className="input-field" 
                placeholder="e.g. 4th Floor, East Wing" 
                value={roomLocation}
                onChange={(e) => setRoomLocation(e.target.value)}
                required 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal F: Admin Edit Room Form */}
      {activeModal === 'room_edit' && selectedRoom && (
        <div className="modal-content card glass-panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: 'var(--text-title)', marginBottom: '4px', textAlign: 'left' }}>
            Update Meeting Room
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', textAlign: 'left', marginBottom: '20px' }}>
            Modify specifications for the physical workspace (Room: {selectedRoom.roomNumber}).
          </p>

          {errorMessage && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleUpdateRoomSubmit}>
            <div className="input-group">
              <label htmlFor="edit-room-num">Room Number (Unique)</label>
              <input 
                type="text" 
                id="edit-room-num" 
                className="input-field" 
                placeholder="e.g. 402" 
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="edit-room-name">Room Name</label>
              <input 
                type="text" 
                id="edit-room-name" 
                className="input-field" 
                placeholder="e.g. Design Studio A" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="edit-room-cap">Seating Capacity</label>
              <input 
                type="number" 
                id="edit-room-cap" 
                className="input-field" 
                placeholder="e.g. 12" 
                min="1"
                value={roomCapacity}
                onChange={(e) => setRoomCapacity(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="edit-room-loc">Building Location</label>
              <input 
                type="text" 
                id="edit-room-loc" 
                className="input-field" 
                placeholder="e.g. 4th Floor, East Wing" 
                value={roomLocation}
                onChange={(e) => setRoomLocation(e.target.value)}
                required 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0', justifyContent: 'flex-start' }}>
              <input 
                type="checkbox" 
                id="edit-room-active" 
                checked={roomActive}
                onChange={(e) => setRoomActive(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="edit-room-active" style={{ fontSize: '13.5px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-title)' }}>
                Active Status (Visible to users for booking)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Update Room'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal G: Recheck Passcode (Verify account password to retrieve/regenerate passcode) */}
      {activeModal === 'recheck_passcode' && selectedBooking && (
        <div className="modal-content card glass-panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: 'var(--text-title)', marginBottom: '4px', textAlign: 'left' }}>
            Verify Password to Recheck Passcode
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', textAlign: 'left', marginBottom: '20px' }}>
            Please enter your account password to verify identity and retrieve/regenerate the passcode.
          </p>

          {errorMessage && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleRecheckPasscodeSubmit}>
            <div className="input-group">
              <label htmlFor="recheck-password">Account Password</label>
              <input 
                type="password" 
                id="recheck-password" 
                className="input-field" 
                placeholder="Enter your account password" 
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                required 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Verify & Show Passcode'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default Modals;
