import React, { useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthContext'
import { allowedEmails } from '../supabase'

export const Login = () => {
  const { login, loading, authError, isDemo, toggleDemoMode, isSupabaseConfigured } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || (!isDemo && !password)) return
    
    setIsSubmitting(true)
    // For demo mode, we don't strictly require password
    await login(email, isDemo ? 'demopass' : password)
    setIsSubmitting(false)
  }

  // Auto-fill a whitelisted email for ease of demo testing
  const handleDemoFill = (selectedEmail) => {
    setEmail(selectedEmail)
    setPassword('••••••••')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      padding: '20px',
      background: 'radial-gradient(circle at 10% 20%, rgba(170, 59, 255, 0.05) 0%, rgba(99, 102, 241, 0.05) 90%)'
    }}>
      {/* Top logo & badge */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '20px',
          background: 'var(--primary-light)',
          border: '1px solid var(--primary-glow)',
          marginBottom: '16px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-color)',
            boxShadow: '0 0 8px var(--primary-color)'
          }}></span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isDemo ? 'Sandbox Console' : 'Secure Core'}
          </span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>
          takingcare<span style={{ color: 'var(--primary-color)' }}>.app</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
          Super-Admin Control Plane
        </p>
      </div>

      {/* Main glass card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-premium)',
        padding: '36px 32px'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
            Administrator Sign In
          </h2>

          {authError && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--danger-color)',
              fontSize: '13px',
              fontWeight: '500',
              lineHeight: '1.4'
            }}>
              {authError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Security Whitelisted Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="e.g. admin@takingcare.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || isSubmitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: isDemo ? '8px' : '20px' }}>
            <label htmlFor="password">Security Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder={isDemo ? "Not required in Sandbox Mode" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isDemo}
              disabled={loading || isSubmitting || isDemo}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', borderSize: '2px' }}></span>
                <span>Authorizing...</span>
              </div>
            ) : (
              'Access Administrative Terminal'
            )}
          </button>
        </form>

        {/* Demo Whitelisted Helper */}
        {isDemo && (
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '500' }}>
              🔑 Whitelisted emails available to test locally:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              {allowedEmails.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleDemoFill(e)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px dashed var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-title)'
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Database Mode Switcher bottom action */}
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={toggleDemoMode}
          className="btn btn-secondary"
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            borderRadius: '20px'
          }}
        >
          {isDemo ? '🔌 Switch to Live Supabase Connection' : '💾 Switch to Local Sandbox Database'}
        </button>
        {!isSupabaseConfigured && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '300px' }}>
            Note: Live Mode is unavailable because Supabase keys are not set in your local .env config.
          </span>
        )}
      </div>
    </div>
  )
}
export default Login
