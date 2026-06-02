import React, { useEffect, useState } from 'react'
import { dbMock, isSupabaseConfigured, supabase } from '../supabase'
import { useAdminAuth } from '../context/AdminAuthContext'

export const BillingAudit = ({ addToast, searchQuery }) => {
  const { isDemo } = useAdminAuth()
  const [ledger, setLedger] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    fetchLedger()
  }, [isDemo])

  const fetchLedger = async () => {
    setLoading(true)
    try {
      if (isDemo || !isSupabaseConfigured) {
        const res = dbMock.getLedger()
        setLedger(res)
      } else {
        const { data, error } = await supabase
          .from('payment_ledger')
          .select('*')
          .order('invoice_date', { ascending: false })

        if (error) throw error
        setLedger(data || [])
      }
    } catch (err) {
      console.error('Error fetching ledger:', err)
      addToast('Failed to pull billing audit ledger.', 'danger')
    } finally {
      setLoading(false)
    }
  }

  // Formatting helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filter logic
  const filteredLedger = ledger.filter((item) => {
    // 1. Status Filter
    if (statusFilter !== 'all' && item.status !== statusFilter) return false

    // 2. Date Filter
    if (dateFilter !== 'all') {
      const itemDate = new Date(item.invoice_date)
      const now = new Date()
      if (dateFilter === 'month') {
        // This calendar month
        if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) return false
      } else if (dateFilter === 'prev_month') {
        // Previous calendar month
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        if (itemDate.getMonth() !== prevMonth || itemDate.getFullYear() !== prevYear) return false
      }
    }

    // 3. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      const matchId = item.id?.toLowerCase().includes(q)
      const matchTenant = item.tenant_name?.toLowerCase().includes(q)
      const matchMethod = item.method?.toLowerCase().includes(q)
      return matchId || matchTenant || matchMethod
    }

    return true
  })

  // Calculations for billing summary cards
  const getSummary = () => {
    let totalPaid = 0
    let totalOutstanding = 0
    let totalOverdue = 0

    filteredLedger.forEach(item => {
      if (item.status === 'paid') totalPaid += item.amount
      else if (item.status === 'outstanding') totalOutstanding += item.amount
      else if (item.status === 'overdue') totalOverdue += item.amount
    })

    return { totalPaid, totalOutstanding, totalOverdue }
  }

  const summary = getSummary()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Auditing global transaction entries & invoices...</p>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      {/* Description header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', maxWidth: '800px', lineHeight: '1.6' }}>
          Platform bookkeeping and invoice ledger. Displays all transaction histories across active practitioner clinics, allowing quick searches by Clinic name, payment methods, or ID.
        </p>
      </div>

      {/* Mini Summary Dashboard for Ledger */}
      <div className="grid-kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue Audited (Filtered)</span>
          <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-title)' }}>
            {formatCurrency(summary.totalPaid + summary.totalOutstanding + summary.totalOverdue)}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--success-color)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success-color)', textTransform: 'uppercase' }}>Net Revenue Collected</span>
          <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-title)' }}>
            {formatCurrency(summary.totalPaid)}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--warning-color)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--warning-color)', textTransform: 'uppercase' }}>Outstanding Invoices</span>
          <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-title)' }}>
            {formatCurrency(summary.totalOutstanding)}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--danger-color)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--danger-color)', textTransform: 'uppercase' }}>Overdue Receivables</span>
          <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-title)' }}>
            {formatCurrency(summary.totalOverdue)}
          </span>
        </div>
      </div>

      {/* Filter and Query controls line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        {/* Status Filters */}
        <div className="chip-container" style={{ marginBottom: 0 }}>
          <button
            onClick={() => setStatusFilter('all')}
            className={`chip ${statusFilter === 'all' ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            All Logs
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`chip ${statusFilter === 'paid' ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--success-border)' }}
          >
            Paid
          </button>
          <button
            onClick={() => setStatusFilter('outstanding')}
            className={`chip ${statusFilter === 'outstanding' ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--warning-border)' }}
          >
            Outstanding
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`chip ${statusFilter === 'overdue' ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--danger-border)' }}
          >
            Overdue
          </button>
        </div>

        {/* Date Filter selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Date Window:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="form-control"
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-sidebar)',
              color: 'var(--text-title)'
            }}
          >
            <option value="all">All Dates</option>
            <option value="month">This Month</option>
            <option value="prev_month">Previous Month</option>
          </select>
        </div>
      </div>

      {/* Ledger Table grid */}
      <div className="glass-panel" style={{ padding: '2px', overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Transaction Reference</th>
                <th>Tenant Clinic Name</th>
                <th>Audited Amount</th>
                <th>Invoice Date</th>
                <th>Routing Gateway</th>
                <th>Ledger Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <line x1="12" y1="10" x2="12" y2="10"></line>
                        <line x1="8" y1="14" x2="16" y2="14"></line>
                      </svg>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>No payment logs match current criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '600', color: 'var(--text-title)' }}>
                        {item.id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--text-title)' }}>
                        {item.tenant_name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--text-title)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>
                        {formatDate(item.invoice_date)}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--text-muted)'
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                          <line x1="2" y1="10" x2="22" y2="10"></line>
                        </svg>
                        {item.method}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default BillingAudit
