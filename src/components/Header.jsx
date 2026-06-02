import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthContext'

export const Header = ({ title, searchQuery, setSearchQuery }) => {
  const { isDemo, toggleDemoMode, isSupabaseConfigured } = useAdminAuth()
  const [theme, setTheme] = useState('light')

  // Theme Initializer
  useEffect(() => {
    // Check local storage or prefers-color-scheme
    const savedTheme = localStorage.getItem('takingcare_console_theme')
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.className = savedTheme
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const defaultTheme = prefersDark ? 'dark' : 'light'
      setTheme(defaultTheme)
      document.documentElement.className = defaultTheme
    }
  }, [])

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    document.documentElement.className = nextTheme
    localStorage.setItem('takingcare_console_theme', nextTheme)
  }

  return (
    <header style={{
      display: 'flex',
      flexDirection: 'column',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-sidebar)',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Top Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        gap: '24px'
      }}>
        {/* Title area */}
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>
            {title}
          </h1>
        </div>

        {/* Global Filter Search & Switches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', width: '280px' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search console archives..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingTop: '9px',
                paddingBottom: '9px',
                fontSize: '13px',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost"
            style={{
              padding: '8px',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-color)',
              color: 'var(--text-title)',
              backgroundColor: 'var(--bg-color)'
            }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Demo Mode alert indicator banner */}
      {isDemo && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(170, 59, 255, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
          borderTop: '1px dashed var(--primary-glow)',
          borderBottom: '1px solid var(--border-color)',
          padding: '8px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          animation: 'slideInBanner 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite alternate'
            }}></span>
            <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-title)' }}>
              🔒 Sandbox Demo Database is active.
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              All client approvals, aphorisms, and logs are simulated inside local browser cache (`localStorage`).
            </span>
          </div>
          
          <button
            type="button"
            onClick={toggleDemoMode}
            className="btn btn-ghost"
            style={{
              padding: '4px 10px',
              fontSize: '10.5px',
              fontWeight: '700',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              color: 'var(--primary-color)',
              border: '1px solid var(--primary-glow)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Go Live
          </button>
        </div>
      )}

      {/* Slide in animation keyframes */}
      <style>{`
        @keyframes slideInBanner {
          from { height: 0; opacity: 0; padding: 0 32px; }
          to { height: auto; opacity: 1; padding: 8px 32px; }
        }
        @keyframes pulse {
          from { opacity: 0.3; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </header>
  )
}
export default Header
