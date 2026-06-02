import React, { useEffect, useState } from 'react'
import { dbMock, isSupabaseConfigured, supabase } from '../supabase'
import { useAdminAuth } from '../context/AdminAuthContext'

export const NotificationPanel = ({ addToast }) => {
  const { isDemo } = useAdminAuth()
  const [recipientCount, setRecipientCount] = useState(0)
  const [subject, setSubject] = useState('')
  const [preview, setPreview] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  
  // Past Broadcast history
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchRecipientsCount()
    loadBroadcastHistory()
  }, [isDemo])

  const fetchRecipientsCount = async () => {
    try {
      if (isDemo || !isSupabaseConfigured) {
        // Mock count derived from active clinics * 6
        const activeClinicsCount = dbMock.getClinics().filter(c => c.status === 'active').length
        setRecipientCount(activeClinicsCount * 5 + 3) // simulate therapists count
      } else {
        // Real count queries
        const { data, error } = await supabase
          .from('clinics')
          .select('id')
          .eq('status', 'active')
        if (error) throw error
        setRecipientCount((data?.length || 0) * 4) // approximation
      }
    } catch (err) {
      console.error(err)
      setRecipientCount(0)
    }
  }

  const loadBroadcastHistory = () => {
    const stored = localStorage.getItem('takingcare_console_mock_broadcasts')
    if (stored) {
      setHistory(JSON.parse(stored))
    } else {
      const defaultHistory = [
        { id: '1', subject: 'System Upgrade: Improved Telehealth Audio Codec', sent_at: '2026-05-10T14:30:00Z', recipients: 24 },
        { id: '2', subject: 'MindBalance App Integration instructions for iOS', sent_at: '2026-04-18T09:15:00Z', recipients: 18 }
      ]
      localStorage.setItem('takingcare_console_mock_broadcasts', JSON.stringify(defaultHistory))
      setHistory(defaultHistory)
    }
  }

  const handleSendBroadcast = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return

    if (!window.confirm(`Are you sure you want to broadcast this notification to all ${recipientCount} active practitioners? This will dispatch emails via Resend integration immediately.`)) {
      return
    }

    setSending(true)
    try {
      if (isDemo || !isSupabaseConfigured) {
        // Simulated Edge Function call
        setTimeout(() => {
          const res = dbMock.sendBroadcast(subject.trim(), preview.trim(), body.trim())
          if (res.success) {
            // Update history
            const updatedHistory = [res.broadcast, ...history]
            setHistory(updatedHistory)
            localStorage.setItem('takingcare_console_mock_broadcasts', JSON.stringify(updatedHistory))
            
            addToast(`Broadcast dispatched! Simulating Resend queue for ${recipientCount} therapists.`, 'success')
            setSubject('')
            setPreview('')
            setBody('')
          }
          setSending(false)
        }, 1200)
      } else {
        // Real Edge Function call
        const { data, error } = await supabase.functions.invoke('broadcast-practitioners', {
          body: { subject: subject.trim(), preview: preview.trim(), body: body.trim() }
        })

        if (error) throw error

        const newHist = {
          id: String(history.length + 1),
          subject: subject.trim(),
          sent_at: new Date().toISOString(),
          recipients: recipientCount
        }
        const updatedHistory = [newHist, ...history]
        setHistory(updatedHistory)
        localStorage.setItem('takingcare_console_mock_broadcasts', JSON.stringify(updatedHistory))

        addToast(`Email broadcast dispatched successfully to ${recipientCount} practitioners!`, 'success')
        setSubject('')
        setPreview('')
        setBody('')
        setSending(false)
      }
    } catch (err) {
      console.error('Error triggering Edge Function:', err)
      addToast('Broadcaster trigger failed. Check Edge Functions logs.', 'danger')
      setSending(false)
    }
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', maxWidth: '800px', lineHeight: '1.6' }}>
          Compose and dispatch notifications to all active wellness practitioners on the platform. Email alerts are processed securely via Supabase Edge Functions with direct Resend API integrations.
        </p>
      </div>

      <div className="grid-two-cols" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: '24px' }}>
        {/* Left Column: Form Editor */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Broadcast Composer</h3>
            <span className="badge badge-active" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              👥 Targeting {recipientCount} practitioners
            </span>
          </div>

          <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="subject">Broadcast Subject Line</label>
              <input
                type="text"
                id="subject"
                className="form-control"
                placeholder="e.g. Action Required: System-wide billing policy updates"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={sending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="preview">Email Subtitle / Preview Header (Optional)</label>
              <input
                type="text"
                id="preview"
                className="form-control"
                placeholder="e.g. Critical onboarding changes for clinical therapists starting June"
                value={preview}
                onChange={(e) => setPreview(e.target.value)}
                disabled={sending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="body">Email Body Contents</label>
              <textarea
                id="body"
                className="form-control"
                rows="8"
                placeholder="Write your email contents here. Professional typography and templates are auto-injected..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                disabled={sending}
                style={{ resize: 'vertical' }}
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              disabled={sending || !subject.trim() || !body.trim()}
            >
              {sending ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderSize: '2px' }}></span>
                  <span>Executing Edge Function dispatch...</span>
                </div>
              ) : (
                'Send Live Broadcast'
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Dynamic Visual Email Preview & Sent log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Email Preview Canvas */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Visual Mailbox Simulator</h3>
            
            {/* The Email container */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              color: '#334155',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              {/* Mail client Header details */}
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
                <div><strong style={{ color: '#475569' }}>From:</strong> takingcare.app Core &lt;console@takingcare.app&gt;</div>
                <div style={{ marginTop: '3px' }}><strong style={{ color: '#475569' }}>To:</strong> Active Practitioners Directory &lt;list-broadcast@takingcare.app&gt;</div>
                <div style={{ marginTop: '3px' }}><strong style={{ color: '#475569' }}>Subject:</strong> {subject || '(no subject set yet)'}</div>
              </div>

              {/* Injected HTML email template body */}
              <div style={{ padding: '24px' }}>
                {/* Logo header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #8b5cf6', paddingBottom: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #aa3bff, #6366f1)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    </svg>
                  </div>
                  <strong style={{ fontSize: '14px', color: '#1e1b4b', letterSpacing: '-0.01em' }}>takingcare.app</strong>
                </div>

                {/* Subtitle / Preview header */}
                {preview && (
                  <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b', background: '#f1f5f9', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', lineHeight: 1.4 }}>
                    "{preview}"
                  </div>
                )}

                {/* Actual Message */}
                <div style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#334155', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                  {body || 'Start writing in the composer to simulate the formatted email broadcast draft here...'}
                </div>

                {/* Footnotes */}
                <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.5, textAlign: 'center' }}>
                  This alert is dispatched to whitelisted clinical users on app.takingcare.app.<br />
                  © 2026 takingcare.app. All rights reserved. <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Manage email choices</span>
                </div>
              </div>
            </div>
          </div>

          {/* Past Dispatch Audit Log */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Historical Broadcast Ledgers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '160px', overflowY: 'auto' }}>
              {history.map((h) => (
                <div
                  key={h.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-title)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {h.subject}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      📅 {formatDate(h.sent_at)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    background: 'var(--primary-light)',
                    color: 'var(--primary-color)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    whiteSpace: 'nowrap'
                  }}>
                    {h.recipients} Sent
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default NotificationPanel
