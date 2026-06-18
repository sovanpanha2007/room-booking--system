import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

function AuthCard({ 
  isRegister, 
  setIsRegister, 
  authName, 
  setAuthName, 
  authEmail, 
  setAuthEmail, 
  authPassword, 
  setAuthPassword, 
  loading, 
  errorMessage, 
  setErrorMessage, 
  handleAuthSubmit, 
  autofillCredentials 
}) {
  return (
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

        {/* Autofill helper block */}
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
  );
}

export default AuthCard;
