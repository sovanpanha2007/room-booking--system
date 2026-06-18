import React from 'react';
import { Bell } from 'lucide-react';

function NotificationToast({ notifications }) {
  if (notifications.length === 0) return null;

  return (
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
  );
}

export default NotificationToast;
