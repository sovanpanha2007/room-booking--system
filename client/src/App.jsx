import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, 
  User, 
  Shield, 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Bell, 
  Key, 
  Grid, 
  Sun, 
  Moon, 
  RefreshCw, 
  Lock, 
  DoorOpen,
  Info
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001/api';
const WS_BASE_URL = 'ws://localhost:5001';

function App() {
  // Theme state
  const [darkTheme, setDarkTheme] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Auth States
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Navigation / View state
  const [currentView, setCurrentView] = useState('bookings'); // bookings, rooms, admin_bookings, admin_rooms
  const [isAdminMode, setIsAdminMode] = useState(false);

  // App Data States
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Modals & Action States
  const [activeModal, setActiveModal] = useState(null); // 'book', 'checkin', 'cancel', 'room_create', 'room_edit', 'success_pin'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Booking Form State
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');
  const [bookingPasscode, setBookingPasscode] = useState('');
  const [autoGenPasscode, setAutoGenPasscode] = useState(true);
  const [createdBookingDetails, setCreatedBookingDetails] = useState(null);
  const [bookingUserEmail, setBookingUserEmail] = useState('');

  // General Passcode Input Modal State (for Cancel & Check-In)
  const [actionPasscode, setActionPasscode] = useState('');

  // Admin Room Creation Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('');
  const [roomLocation, setRoomLocation] = useState('');
  
  // Auth Form States
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Live Toast Notifications
  const [notifications, setNotifications] = useState([]);

  // WebSocket Ref
  const wsRef = useRef(null);

  // Synchronize CSS Theme Class
  useEffect(() => {
    if (darkTheme) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkTheme]);

  // Fetch Rooms & Bookings on Login or View change
  useEffect(() => {
    if (token) {
      fetchRooms();
      fetchBookings();
    }
  }, [token, currentView]);

  // WebSocket connection management
  useEffect(() => {
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    const connectWebSocket = () => {
      const ws = new WebSocket(WS_BASE_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected to live update server');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleWebSocketEvent(payload);
        } catch (err) {
          console.error('[WS] Error parsing websocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Connection closed. Reconnecting in 3 seconds...');
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('[WS] Connection error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  // Handle live updates and show alert banners
  const handleWebSocketEvent = (payload) => {
    const { event, data } = payload;
    
    // Skip welcome connection event
    if (event === 'connected') return;

    // Toast alert description builder
    let alertMessage = '';
    let refreshData = false;

    switch (event) {
      case 'room_created':
        alertMessage = `New Room Added: ${data.name} (Room ${data.roomNumber})`;
        refreshData = true;
        break;
      case 'room_updated':
        alertMessage = `Room Updated: ${data.name} (Room ${data.roomNumber})`;
        refreshData = true;
        break;
      case 'room_deleted':
        alertMessage = `A room has been deactivated. Check your active schedules.`;
        refreshData = true;
        break;
      case 'booking_created':
        alertMessage = `New Booking registered for ${data.room ? data.room.name : 'a room'}`;
        refreshData = true;
        break;
      case 'booking_updated':
        alertMessage = `Booking ID ${data.id.substring(0, 8)} updated`;
        refreshData = true;
        break;
      case 'booking_cancelled':
        alertMessage = `Booking ID ${data.id.substring(0, 8)} cancelled`;
        refreshData = true;
        break;
      case 'booking_checked_in':
        alertMessage = `Checked in successfully for ${data.room ? data.room.name : 'room'}`;
        refreshData = true;
        break;
      case 'booking_status_updated':
        alertMessage = `Booking status changed by administrator to: ${data.status}`;
        refreshData = true;
        break;
      default:
        break;
    }

    if (alertMessage) {
      addNotification(alertMessage, event);
    }

    if (refreshData) {
      // Trigger soft refreshing of room and booking data
      fetchRoomsSilent();
      fetchBookingsSilent();
    }
  };

  const addNotification = (message, type) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    // Automatically wipe toast after 4.5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  // API Client Handlers
  const fetchRooms = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Failed to fetch rooms from backend');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsSilent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRooms(data.data);
    } catch (err) {
      console.error('Silent room fetch failed:', err);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const endpoint = isAdminMode ? `${API_BASE_URL}/admin/bookings` : `${API_BASE_URL}/bookings`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Failed to fetch bookings from backend');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsSilent = async () => {
    try {
      const endpoint = isAdminMode ? `${API_BASE_URL}/admin/bookings` : `${API_BASE_URL}/bookings`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBookings(data.data);
    } catch (err) {
      console.error('Silent bookings fetch failed:', err);
    }
  };

  // Auth Operations
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    const url = isRegister ? `${API_BASE_URL}/auth/register` : `${API_BASE_URL}/auth/login`;
    const payload = isRegister 
      ? { name: authName, email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        if (isRegister) {
          // Auto-login or shift to login panel
          setIsRegister(false);
          setAuthPassword('');
          addNotification('Registration successful! Please login.', 'auth');
        } else {
          // Save login session
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          setToken(data.data.token);
          setUser(data.data.user);
          setIsAdminMode(data.data.user.role === 'ADMIN');
          setCurrentView(data.data.user.role === 'ADMIN' ? 'admin_bookings' : 'bookings');
          addNotification(`Welcome back, ${data.data.user.name}!`, 'auth');
        }
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Communication error with authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setRooms([]);
    setBookings([]);
    setIsAdminMode(false);
    setCurrentView('bookings');
    if (wsRef.current) {
      wsRef.current.close();
    }
    addNotification('Logged out successfully.', 'auth');
  };

  // Booking Operations
  const handleCreateBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    const passcodeToSend = autoGenPasscode ? '' : bookingPasscode;
    if (!autoGenPasscode && (!bookingPasscode || bookingPasscode.length < 4)) {
      setErrorMessage('Custom passcode must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          startTime: new Date(bookingStart).toISOString(),
          endTime: new Date(bookingEnd).toISOString(),
          passcode: passcodeToSend,
          userEmail: user.role === 'ADMIN' ? bookingUserEmail : undefined
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setCreatedBookingDetails(data.data);
        setActiveModal('success_pin');
        setBookingStart('');
        setBookingEnd('');
        setBookingPasscode('');
        setBookingUserEmail('');
        fetchBookingsSilent();
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Failed to submit booking transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!actionPasscode && user.role !== 'ADMIN') {
      setErrorMessage('Passcode is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${selectedBooking.id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passcode: actionPasscode })
      });
      const data = await res.json();

      if (data.success) {
        addNotification('Checked in successfully!', 'success');
        setActiveModal(null);
        setActionPasscode('');
        fetchBookingsSilent();
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Error during check-in process');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!actionPasscode && user.role !== 'ADMIN') {
      setErrorMessage('Passcode is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${selectedBooking.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passcode: actionPasscode })
      });
      const data = await res.json();

      if (data.success) {
        addNotification('Booking cancelled successfully', 'success');
        setActiveModal(null);
        setActionPasscode('');
        fetchBookingsSilent();
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Error during cancellation process');
    } finally {
      setLoading(false);
    }
  };

  // Admin Room Operations
  const handleCreateRoomSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!roomNumber || !roomName || !roomCapacity || !roomLocation) {
      setErrorMessage('All room specifications are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomNumber,
          name: roomName,
          capacity: parseInt(roomCapacity, 10),
          location: roomLocation
        })
      });
      const data = await res.json();

      if (data.success) {
        addNotification(`Room ${roomNumber} created successfully!`, 'success');
        setActiveModal(null);
        setRoomNumber('');
        setRoomName('');
        setRoomCapacity('');
        setRoomLocation('');
        fetchRoomsSilent();
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Failed to create new room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId, num) => {
    if (!window.confirm(`Are you sure you want to deactivate Room ${num}? All future bookings on this room will be cancelled!`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        addNotification(`Room ${num} deactivated.`, 'success');
        fetchRoomsSilent();
        fetchBookingsSilent();
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Error deactivating room');
    } finally {
      setLoading(false);
    }
  };

  // Admin Booking Status Force Update
  const handleForceUpdateStatus = async (bookingId, newStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        addNotification(`Status updated to ${newStatus}`, 'success');
        fetchBookingsSilent();
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      setErrorMessage('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Helper values for Autofill buttons (senior UX shortcut)
  const autofillCredentials = (email, pass) => {
    setAuthEmail(email);
    setAuthPassword(pass);
  };

  // Helper formatter for Date output
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 🔔 Notification Toasts */}
      <div className="toast-container">
        {notifications.map((n) => (
          <div key={n.id} className="toast glass-panel animate-fade-in" style={{ borderLeft: '4px solid var(--primary)' }}>
            <Bell size={18} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-title)' }}>Live Update</p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{n.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 🔓 Unauthenticated view (Login / Register Card) */}
      {!token ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '56px', 
                height: '56px', 
                borderRadius: '12px', 
                background: 'var(--primary-light)', 
                color: 'var(--primary)',
                marginBottom: '16px'
              }}>
                <Calendar size={28} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', color: 'var(--text-title)' }}>
                {isRegister ? 'Create Account' : 'Room Booking Gateway'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {isRegister ? 'Sign up to reserve meeting rooms' : 'Access your meeting room manager'}
              </p>
            </div>

            {errorMessage && (
              <div style={{ 
                background: 'var(--danger-light)', 
                color: 'var(--danger)', 
                padding: '12px', 
                borderRadius: '8px', 
                fontSize: '13.5px', 
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {isRegister && (
                <div className="input-group">
                  <label htmlFor="auth-name">Full Name</label>
                  <input 
                    type="text" 
                    id="auth-name" 
                    className="input-field" 
                    placeholder="Jane Doe" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="auth-email">Email Address</label>
                <input 
                  type="email" 
                  id="auth-email" 
                  className="input-field" 
                  placeholder="jane@company.com" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="auth-password">Password</label>
                <input 
                  type="password" 
                  id="auth-password" 
                  className="input-field" 
                  placeholder="••••••••" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : (isRegister ? 'Register Account' : 'Sign In')}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13.5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isRegister ? 'Already registered?' : "Don't have an account?"}{' '}
              </span>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMessage('');
                }}
              >
                {isRegister ? 'Log In' : 'Create One'}
              </button>
            </div>

            {/* Autofill helper block (Senior UX touch) */}
            <div style={{ 
              marginTop: '24px', 
              paddingTop: '20px', 
              borderTop: '1px solid var(--glass-border)', 
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                ⚡ Test accounts seed profiles:
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '11px', flex: 1 }}
                  onClick={() => autofillCredentials('admin@rms.com', 'admin123')}
                >
                  Admin Profile
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '11px', flex: 1 }}
                  onClick={() => autofillCredentials('user@rms.com', 'user123')}
                >
                  Standard User
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 🏢 Authenticated View (Sidebar Layout) */
        <div className="dashboard-grid">
          
          {/* 🗂️ Sidebar Menu */}
          <aside className="glass-panel" style={{ 
            background: 'var(--sidebar-bg)', 
            borderRight: '1px solid var(--glass-border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 10
          }}>
            <div>
              {/* Brand Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                <div style={{ 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  padding: '8px', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <DoorOpen size={20} />
                </div>
                <h1 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontSize: '20px', 
                  fontWeight: 800, 
                  margin: 0,
                  color: 'var(--text-title)',
                  letterSpacing: '-0.5px'
                }}>
                  RoomBook
                </h1>
              </div>

              {/* User Identity Details */}
              <div style={{ 
                background: 'var(--card-bg)', 
                border: '1px solid var(--card-border)',
                padding: '12px 14px', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '28px'
              }}>
                <div style={{ 
                  background: user.role === 'ADMIN' ? 'var(--danger-light)' : 'var(--primary-light)', 
                  color: user.role === 'ADMIN' ? 'var(--danger)' : 'var(--primary)',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex'
                }}>
                  {user.role === 'ADMIN' ? <Shield size={18} /> : <User size={18} />}
                </div>
                <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                  <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-title)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.name}
                  </p>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-cancelled' : 'badge-pending'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Navigation Menu Buttons */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left', paddingLeft: '8px', marginBottom: '4px' }}>
                  User Dashboard
                </p>
                <button 
                  onClick={() => { setCurrentView('bookings'); setIsAdminMode(false); }}
                  className={`btn ${(!isAdminMode && currentView === 'bookings') ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', width: '100%', fontSize: '14px', padding: '10px 14px' }}
                >
                  <Calendar size={16} />
                  My Bookings
                </button>
                <button 
                  onClick={() => { setCurrentView('rooms'); setIsAdminMode(false); }}
                  className={`btn ${(!isAdminMode && currentView === 'rooms') ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', width: '100%', fontSize: '14px', padding: '10px 14px' }}
                >
                  <DoorOpen size={16} />
                  Available Rooms
                </button>

                {user.role === 'ADMIN' && (
                  <>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left', paddingLeft: '8px', marginTop: '16px', marginBottom: '4px' }}>
                      Admin Panel
                    </p>
                    <button 
                      onClick={() => { setCurrentView('admin_bookings'); setIsAdminMode(true); }}
                      className={`btn ${(isAdminMode && currentView === 'admin_bookings') ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'flex-start', width: '100%', fontSize: '14px', padding: '10px 14px', border: isAdminMode && currentView === 'admin_bookings' ? 'none' : '1px dashed var(--danger)' }}
                    >
                      <Shield size={16} />
                      All Bookings
                    </button>
                    <button 
                      onClick={() => { setCurrentView('admin_rooms'); setIsAdminMode(true); }}
                      className={`btn ${(isAdminMode && currentView === 'admin_rooms') ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'flex-start', width: '100%', fontSize: '14px', padding: '10px 14px', border: isAdminMode && currentView === 'admin_rooms' ? 'none' : '1px dashed var(--danger)' }}
                    >
                      <Grid size={16} />
                      Room Settings
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Sidebar Bottom Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => setDarkTheme(!darkTheme)} 
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '13.5px', justifyContent: 'center' }}
              >
                {darkTheme ? <Sun size={16} /> : <Moon size={16} />}
                {darkTheme ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ width: '100%', fontSize: '13.5px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </aside>

          {/* 🖥️ Main Dashboard Panel */}
          <main style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', maxHeight: '100vh' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', color: 'var(--text-title)', textTransform: 'capitalize' }}>
                  {currentView.replace('_', ' ')}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  {currentView === 'bookings' && 'Browse your current active reservations and check-in statuses'}
                  {currentView === 'rooms' && 'Select a room, verify conflict times, and reserve meetings'}
                  {currentView === 'admin_bookings' && 'Global control center to update state and monitor occupancy'}
                  {currentView === 'admin_rooms' && 'Add new rooms or soft-delete current listings'}
                </p>
              </div>
              <button 
                onClick={currentView.startsWith('admin') ? fetchBookings : fetchRooms} 
                className="btn btn-secondary btn-icon"
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </header>

            {errorMessage && (
              <div style={{ 
                background: 'var(--danger-light)', 
                color: 'var(--danger)', 
                padding: '14px', 
                borderRadius: '10px', 
                fontSize: '14px', 
                fontWeight: 600,
                textAlign: 'left',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
                {errorMessage}
              </div>
            )}

            {/* Primary View Router */}
            {loading && bookings.length === 0 && rooms.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card shimmer" style={{ height: '120px' }}></div>
                <div className="card shimmer" style={{ height: '120px' }}></div>
              </div>
            ) : (
              <>
                {/* 1. User Bookings view */}
                {currentView === 'bookings' && (
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
                )}

                {/* 2. User Rooms Browse list */}
                {currentView === 'rooms' && (
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
                )}

                {/* 3. Admin View All Bookings */}
                {isAdminMode && currentView === 'admin_bookings' && (
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
                )}

                {/* 4. Admin View Room Settings */}
                {isAdminMode && currentView === 'admin_rooms' && (
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
                                <button 
                                  className="btn btn-secondary btn-icon"
                                  style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                                  onClick={() => handleDeleteRoom(room.id, room.roomNumber)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}

      {/* 📥 Modal System */}
      {activeModal && (
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
                {user.role === 'ADMIN' ? (
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
                {user.role === 'ADMIN' ? (
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

          {/* Modal D: Booking Success Passcode Code Display (Crucial senior UX step) */}
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
                Booking Registered!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Your room has been reserved. A confirmation email has been queued.
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

        </div>
      )}
    </div>
  );
}

export default App;
