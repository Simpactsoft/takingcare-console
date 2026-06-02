import React, { useEffect, useState } from 'react'
import { dbMock, isSupabaseConfigured, supabase } from '../supabase'
import { useAdminAuth } from '../context/AdminAuthContext'

export const AphorismCMS = ({ addToast, searchQuery }) => {
  const { isDemo } = useAdminAuth()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  // Editor states
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [quoteText, setQuoteText] = useState('')
  const [quoteAuthor, setQuoteAuthor] = useState('')
  const [quoteCategory, setQuoteCategory] = useState('Mindfulness')

  // Bulk import states
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkParseError, setBulkParseError] = useState(null)

  useEffect(() => {
    fetchQuotes()
  }, [isDemo])

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      if (isDemo || !isSupabaseConfigured) {
        const res = dbMock.getAphorisms()
        setQuotes(res)
      } else {
        const { data, error } = await supabase
          .from('aphorisms')
          .select('*')
          .order('id', { ascending: false })

        if (error) throw error
        setQuotes(data || [])
      }
    } catch (err) {
      console.error('Error fetching aphorisms:', err)
      addToast('Failed to pull aphorisms CMS database.', 'danger')
    } finally {
      setLoading(false)
    }
  }

  // Handle single quote upsert
  const handleSaveQuote = async (e) => {
    e.preventDefault()
    if (!quoteText.trim()) return

    try {
      if (editingId) {
        // Edit existing
        if (isDemo || !isSupabaseConfigured) {
          const res = dbMock.updateAphorism(editingId, quoteText.trim(), quoteAuthor.trim() || 'Anonymous', quoteCategory)
          if (res.success) {
            setQuotes(prev => prev.map(q => q.id === editingId ? res.quote : q))
            addToast('Aphorism updated successfully!', 'success')
          }
        } else {
          const { error } = await supabase
            .from('aphorisms')
            .update({ text: quoteText.trim(), author: quoteAuthor.trim() || 'Anonymous', category: quoteCategory })
            .eq('id', editingId)
          if (error) throw error
          setQuotes(prev => prev.map(q => q.id === editingId ? { ...q, text: quoteText, author: quoteAuthor, category: quoteCategory } : q))
          addToast('Aphorism updated successfully!', 'success')
        }
      } else {
        // Create new
        const newObj = {
          text: quoteText.trim(),
          author: quoteAuthor.trim() || 'Anonymous',
          category: quoteCategory
        }

        if (isDemo || !isSupabaseConfigured) {
          const res = dbMock.addAphorisms([newObj])
          if (res.success) {
            setQuotes(prev => [...res.quotes, ...prev])
            addToast('New quote added to mindbalance.aphorisms!', 'success')
          }
        } else {
          const { data, error } = await supabase
            .from('aphorisms')
            .insert([newObj])
            .select()
          if (error) throw error
          if (data) setQuotes(prev => [...data, ...prev])
          addToast('New quote added to mindbalance.aphorisms!', 'success')
        }
      }
      closeEditor()
    } catch (err) {
      console.error('Error saving aphorism:', err)
      addToast('Failed to save aphorism.', 'danger')
    }
  }

  // Handle single delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this aphorism? This will remove it from mindfulness recommendations.')) return

    try {
      if (isDemo || !isSupabaseConfigured) {
        dbMock.deleteAphorism(id)
        setQuotes(prev => prev.filter(q => q.id !== id))
        addToast('Aphorism deleted successfully.', 'warning')
      } else {
        const { error } = await supabase
          .from('aphorisms')
          .delete()
          .eq('id', id)
        if (error) throw error
        setQuotes(prev => prev.filter(q => q.id !== id))
        addToast('Aphorism deleted successfully.', 'warning')
      }
    } catch (err) {
      console.error('Error deleting aphorism:', err)
      addToast('Failed to delete aphorism.', 'danger')
    }
  }

  // Handle Bulk Import
  const handleBulkImport = async () => {
    setBulkParseError(null)
    const lines = bulkText.split('\n').filter(line => line.trim().length > 0)
    
    if (lines.length === 0) {
      setBulkParseError('Please enter at least one line of CSV data.')
      return
    }

    const parsed = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Support semicolon or comma separation
      const separator = line.includes(';') ? ';' : ','
      const parts = line.split(separator).map(p => p.trim())
      
      if (parts.length < 2) {
        setBulkParseError(`Line ${i + 1} is invalid. Format must be: "Quote text [separator] Author [separator] Category (optional)"`)
        return
      }

      parsed.push({
        text: parts[0],
        author: parts[1] || 'Anonymous',
        category: parts[2] || 'General'
      })
    }

    try {
      if (isDemo || !isSupabaseConfigured) {
        const res = dbMock.addAphorisms(parsed)
        if (res.success) {
          setQuotes(prev => [...res.quotes, ...prev])
          addToast(`Bulk Imported ${parsed.length} quotes!`, 'success')
        }
      } else {
        const { data, error } = await supabase
          .from('aphorisms')
          .insert(parsed)
          .select()
        if (error) throw error
        if (data) setQuotes(prev => [...data, ...prev])
        addToast(`Bulk Imported ${parsed.length} quotes!`, 'success')
      }
      setBulkText('')
      setBulkOpen(false)
    } catch (err) {
      console.error('Error in bulk import:', err)
      addToast('Bulk import query failed. Check table constraints.', 'danger')
    }
  }

  const openEditor = (quote = null) => {
    if (quote) {
      setEditingId(quote.id)
      setQuoteText(quote.text)
      setQuoteAuthor(quote.author)
      setQuoteCategory(quote.category || 'Mindfulness')
    } else {
      setEditingId(null)
      setQuoteText('')
      setQuoteAuthor('')
      setQuoteCategory('Mindfulness')
    }
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId(null)
    setQuoteText('')
    setQuoteAuthor('')
  }

  // Aggregate user feedback ratios
  const getFeedbackSummary = () => {
    let totalUp = 0
    let totalDown = 0
    
    quotes.forEach((q) => {
      totalUp += q.rating_thumbs_up || 0
      totalDown += q.rating_thumbs_down || 0
    })

    const totalVotes = totalUp + totalDown
    const ratio = totalVotes > 0 ? Math.round((totalUp / totalVotes) * 100) : 100

    return { totalUp, totalDown, totalVotes, ratio }
  }

  const summary = getFeedbackSummary()

  // Filter quotes locally for searchsnaps
  const filteredQuotes = quotes.filter((q) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim()
      const matchText = q.text?.toLowerCase().includes(query)
      const matchAuthor = q.author?.toLowerCase().includes(query)
      const matchCat = q.category?.toLowerCase().includes(query)
      return matchText || matchAuthor || matchCat
    }
    return true
  })

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Loading Daily Aphorisms & Therapist Sentiment Logs...</p>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      {/* 2-Column header with analytical graphs */}
      <div className="grid-two-cols" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '24px' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Modify therapeutic quotes displayed in the MindBalance app workspace. Super-Admins can audit which quotes align best with practitioner and patient wellness based on feedback aggregates.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button onClick={() => openEditor()} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Compose Quote
            </button>
            <button onClick={() => setBulkOpen(prev => !prev)} className="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              Bulk Import CSV
            </button>
          </div>
        </div>

        {/* Feedback card ratios */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Therapist Sentiment Index</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-title)' }}>{summary.ratio}%</h3>
              <span style={{ fontSize: '11.5px', color: 'var(--success-color)', fontWeight: '600' }}>Positive Feedback</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--border-color)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${summary.ratio}%`, background: 'linear-gradient(90deg, var(--primary-color), var(--success-color))' }}></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>👍 {summary.totalUp} Likes</span>
            <span>👎 {summary.totalDown} Dislikes</span>
          </div>
        </div>
      </div>

      {/* Bulk Import Expandable Area */}
      {bulkOpen && (
        <div className="glass-panel" style={{ marginBottom: '24px', animation: 'pageFadeIn 0.25s ease-out' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Bulk Load CSV Quotes</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Paste raw quotes, one per line. Format: <code>Quote Text ; Author ; Category</code>. Semicolon or comma is supported.
          </p>
          
          {bulkParseError && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-color)', fontSize: '12px', fontWeight: '500', marginBottom: '16px' }}>
              {bulkParseError}
            </div>
          )}

          <textarea
            className="form-control"
            rows="6"
            placeholder="Slow down and enjoy the journey; Carl Honore; Mindfulness&#10;To know yourself is the beginning of all wisdom; Socrates; Cognitive"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            style={{ width: '100%', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
          ></textarea>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
            <button onClick={() => setBulkOpen(false)} className="btn btn-ghost" style={{ padding: '8px 16px' }}>Cancel</button>
            <button onClick={handleBulkImport} className="btn btn-primary" style={{ padding: '8px 16px' }}>Parse & Insert Batch</button>
          </div>
        </div>
      )}

      {/* Editor Modal Inline Panel */}
      {editorOpen && (
        <div className="glass-panel" style={{ marginBottom: '24px', animation: 'pageFadeIn 0.25s ease-out', border: '1px solid var(--primary-glow)', boxShadow: '0 8px 30px var(--primary-glow)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            {editingId ? 'Edit Daily Aphorism' : 'Compose Wellness Aphorism'}
          </h3>
          <form onSubmit={handleSaveQuote}>
            <div className="form-group">
              <label>Quote Content</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="e.g. In the middle of difficulty lies opportunity..."
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                required
                style={{ width: '100%' }}
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Author / Source Attribution</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Albert Einstein"
                  value={quoteAuthor}
                  onChange={(e) => setQuoteAuthor(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Category Label</label>
                <select
                  value={quoteCategory}
                  onChange={(e) => setQuoteCategory(e.target.value)}
                  className="form-control"
                >
                  <option value="Mindfulness">Mindfulness & Presence</option>
                  <option value="Cognitive">Cognitive Restructuring</option>
                  <option value="Self-Compassion">Self-Compassion & Grace</option>
                  <option value="Awareness">Awareness & Growth</option>
                  <option value="General">General Reflection</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={closeEditor} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary">Save Quote Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* Aphorisms Table Ledger */}
      <div className="glass-panel" style={{ padding: '2px', overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Wellness Quote</th>
                <th>Source Author</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Therapist Ratings</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>No quotes available.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const ratingTotal = (q.rating_thumbs_up || 0) + (q.rating_thumbs_down || 0)
                  const scoreRatio = ratingTotal > 0 ? Math.round(((q.rating_thumbs_up || 0) / ratingTotal) * 100) : 100
                  return (
                    <tr key={q.id}>
                      <td>
                        <span style={{ fontWeight: '500', color: 'var(--text-title)', fontSize: '14px', lineHeight: '1.5', display: 'block' }}>
                          "{q.text}"
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>
                          {q.author}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary-color)'
                        }}>
                          {q.category || 'Mindfulness'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-title)' }}>
                            👍 {q.rating_thumbs_up || 0} / 👎 {q.rating_thumbs_down || 0}
                          </span>
                          <span style={{ fontSize: '10px', color: scoreRatio >= 85 ? 'var(--success-color)' : 'var(--text-muted)', fontWeight: '600' }}>
                            {ratingTotal > 0 ? `${scoreRatio}% positive` : 'no votes logged'}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditor(q)}
                            className="btn btn-ghost"
                            style={{ padding: '6px 8px', borderRadius: '6px' }}
                            title="Edit Quote"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="btn btn-ghost"
                            style={{ padding: '6px 8px', borderRadius: '6px', color: 'var(--danger-color)' }}
                            title="Delete Quote"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default AphorismCMS
