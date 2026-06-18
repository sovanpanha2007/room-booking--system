import React from 'react';
import { 
  LogOut, 
  User, 
  Shield, 
  Calendar, 
  Sun, 
  Moon, 
  DoorOpen, 
  Grid 
} from 'lucide-react';

function Sidebar({ 
  user, 
  currentView, 
  setCurrentView, 
  isAdminMode, 
  setIsAdminMode, 
  darkTheme, 
  setDarkTheme, 
  handleLogout 
}) {
  return (
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
  );
}

export default Sidebar;
