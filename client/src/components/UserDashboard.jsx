import React from 'react';
import { Calendar, DoorOpen, Users, MapPin } from 'lucide-react';

function UserDashboard({ 
  currentView, 
  bookings, 
  rooms, 
  formatDate, 
  user,
  setSelectedBooking,
  setSelectedRoom,
  setActionPasscode,
  setErrorMessage,
  setActiveModal,
  setBookingStart,
  setBookingEnd,
  setCurrentView
}) {
  
  if (currentView === 'bookings') {
    return (
      <div className="animate-fade-in">
        {bookings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Calendar size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
            <h3 style={{ color: 'var(--text-title)', fontSize: '18px', fontWeight: 700 }}>No reservations found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '360px', margin: '8px auto 20px' }}>
              You do not have any room bookings scheduled yet. Head over to available rooms to start!
            </p>
            <button onClick={() => setCurrentView('rooms')} className="btn btn-primary">
              Book a Room
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Location</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-title)' }}>
                        {booking.room ? booking.room.name : 'Unknown Room'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Room Number: {booking.room ? booking.room.roomNumber : 'N/A'}
                      </div>
                    </td>
                    <td>{booking.room ? booking.room.location : 'N/A'}</td>
                    <td>{formatDate(booking.startTime)}</td>
                    <td>{formatDate(booking.endTime)}</td>
                    <td>
                      <span className={`badge badge-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Check-In is strictly allowed only when status is CONFIRMED */}
                        {booking.status === 'CONFIRMED' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '12.5px' }}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setActionPasscode('');
                              setErrorMessage('');
                              setActiveModal('checkin');
                            }}
                          >
                            Check In
                          </button>
                        )}

                        {/* Standard users can only cancel PENDING bookings. Admins can cancel PENDING or CONFIRMED. */}
                        {((booking.status === 'PENDING') || (booking.status === 'CONFIRMED' && user && user.role === 'ADMIN')) && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '12.5px', color: 'var(--danger)' }}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setActionPasscode('');
                              setErrorMessage('');
                              setActiveModal('cancel');
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'rooms') {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '24px' 
      }} className="animate-fade-in">
        {rooms.map((room) => (
          <div key={room.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  padding: '8px', 
                  borderRadius: '10px'
                }}>
                  <DoorOpen size={20} />
                </div>
                <span className="badge badge-active">Active</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-title)', marginBottom: '4px' }}>
                {room.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '14px' }}>
                Room {room.roomNumber}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
                  <Users size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>Capacity: <strong>{room.capacity} seats</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
                  <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>{room.location}</span>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => {
                setSelectedRoom(room);
                setErrorMessage('');
                // Init inputs in local timezone formatting
                const nowStr = new Date(Date.now() + 60*60*1000).toISOString().substring(0, 16);
                const endStr = new Date(Date.now() + 2*60*60*1000).toISOString().substring(0, 16);
                setBookingStart(nowStr);
                setBookingEnd(endStr);
                setActiveModal('book');
              }}
            >
              Book Now
            </button>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default UserDashboard;
