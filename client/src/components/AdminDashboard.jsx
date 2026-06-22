import React from 'react';
import { Info, Plus, Trash2, Edit } from 'lucide-react';

function AdminDashboard({ 
  currentView, 
  bookings, 
  rooms, 
  formatDate, 
  setErrorMessage, 
  setActiveModal, 
  setSelectedRoom,
  setRoomNumber, 
  setRoomName, 
  setRoomCapacity, 
  setRoomLocation, 
  setRoomActive,
  handleDeleteRoom, 
  handleForceUpdateStatus 
}) {

  if (currentView === 'admin_bookings') {
    return (
      <div className="animate-fade-in">
        {bookings.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <Info size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-title)', fontWeight: 600 }}>No bookings recorded in database.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Reserved By</th>
                  <th>Room Details</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Admin Override</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-title)' }}>
                        {booking.user ? booking.user.name : 'Unknown'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {booking.user ? booking.user.email : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {booking.room ? booking.room.name : 'Deleted Room'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Room Number: {booking.room ? booking.room.roomNumber : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13.5px' }}>Start: {formatDate(booking.startTime)}</div>
                      <div style={{ fontSize: '13.5px' }}>End: {formatDate(booking.endTime)}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="input-field" 
                        style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}
                        value={booking.status}
                        onChange={(e) => handleForceUpdateStatus(booking.id, e.target.value)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="CHECKED_IN">CHECKED IN</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="NO_SHOW">NO SHOW</option>
                      </select>
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

  if (currentView === 'admin_rooms') {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'left' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setErrorMessage('');
              setRoomNumber('');
              setRoomName('');
              setRoomCapacity('');
              setRoomLocation('');
              setActiveModal('room_create');
            }}
          >
            <Plus size={16} />
            Add New Room
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Room Name</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Active Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-title)' }}>{room.roomNumber}</td>
                  <td>{room.name}</td>
                  <td>{room.capacity} seats</td>
                  <td>{room.location}</td>
                  <td>
                    <span className={`badge ${room.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {room.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-icon"
                        style={{ color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.1)' }}
                        onClick={() => {
                          setErrorMessage('');
                          setSelectedRoom(room);
                          setRoomNumber(room.roomNumber);
                          setRoomName(room.name);
                          setRoomCapacity(room.capacity.toString());
                          setRoomLocation(room.location);
                          setRoomActive(room.isActive);
                          setActiveModal('room_edit');
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-icon"
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                        onClick={() => handleDeleteRoom(room.id, room.roomNumber)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

export default AdminDashboard;
