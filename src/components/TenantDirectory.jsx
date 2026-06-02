import React, { useEffect, useState } from 'react'
import { dbMock, isSupabaseConfigured, supabase } from '../supabase'
import { useAdminAuth } from '../context/AdminAuthContext'

export const TenantDirectory = ({ addToast, searchQuery }) => {
  const { isDemo } = useAdminAuth()
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchClinics()
  }, [isDemo])

  const fetchClinics = async () => {
    setLoading(true)
    try {
      if (isDemo || !isSupabaseConfigured) {
        // Mock DB pull
        const res = dbMock.getClinics()
        setClinics(res)
      } else {
        // Live DB pull
        const { data, error } = await supabase
          .from('clinics')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setClinics(data || [])
      }
    } catch (err) {
      console.error('Error fetching clinics:', err)
      addToast('Failed to pull clinics directory.', 'danger')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, name, targetStatus) => {
    setProcessingId(id)
    try {
      if (isDemo || !isSupabaseConfigured) {
        // Persist mock status changes
        setTimeout(() => {
          const res = dbMock.updateClinicStatus(id, targetStatus)
          if (res.success) {
            setClinics(prev => prev.map(c => c.id === id ? { ...c, status: targetStatus } : c))
            triggerToast(name, targetStatus)
          } else {
            addToast('Error: Clinic not found.', 'danger')
          }
          setProcessingId(null)
        }, 400)
      } else {
        // Live DB status changes
        const { error } = await supabase
          .from('clinics')
          .update({ status: targetStatus })
          .eq('id', id)

        if (error) throw error
        setClinics(prev => prev.map(c => c.id === id ? { ...c, status: targetStatus } : c))
        triggerToast(name, targetStatus)
        setProcessingId(null)
      }
    } catch (err) {
      console.error('Error updating clinic status:', err)
      addToast(`Failed to update ${name} status.`, 'danger')
      setProcessingId(null)
    }
  }

  const triggerToast = (name, status) => {
    if (status === 'active') {
      addToast(`Clinic Approved: "${name}" workspace unlocked at app.takingcare.app`, 'success')
    } else if (status === 'suspended') {
      addToast(`Clinic Suspended: "${name}" locked out from database access.`, 'warning')
    } else {
      addToast(`Clinic status updated for "${name}".`, 'info')
    }
  }

  // Filter and Search logic
  const filteredClinics = clinics.filter((c) => {
    // 1. Status Filter
    if (statusFilter !== 'all' && c.status !== statusFilter) return false

    // 2. Search Query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = c.name?.toLowerCase().includes(q)
      const matchPrac = c.practitioner?.toLowerCase().includes(q)
      const matchEmail = c.email?.toLowerCase().includes(q)
      return matchName || matchPrac || matchEmail
    }

    return true
  })

  // Get counts for filters
  const getCounts = (statusVal) => {
    if (statusVal === 'all') return clinics.length
    return clinics.filter(c => c.status === statusVal).length
  }

  const formatDate = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Reviewing clinic registration ledgers...</p>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      {/* Description Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', maxWidth: '800px', lineHeight: '1.6' }}>
          Welcome to the Clinic Approvals & Suspensions hub. New clinic signups remain in <strong style={{ color: 'var(--warning-color)' }}>Pending</strong> state until manually audited and approved by the Super-Admin. Suspended clinics are immediately locked out of API queries.
        </p>
      </div>

      {/* Interactive Status Filter Chips */}
      <div className="chip-container">
        <button
          onClick={() => setStatusFilter('all')}
          className={`chip ${statusFilter === 'all' ? 'active' : ''}`}
        >
          All Clinics ({getCounts('all')})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`chip ${statusFilter === 'pending' ? 'active' : ''}`}
          style={{ borderColor: 'var(--warning-border)' }}
        >
          Pending Review ({getCounts('pending')})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`chip ${statusFilter === 'active' ? 'active' : ''}`}
          style={{ borderColor: 'var(--success-border)' }}
        >
          Active Workspaces ({getCounts('active')})
        </button>
        <button
          onClick={() => setStatusFilter('suspended')}
          className={`chip ${statusFilter === 'suspended' ? 'active' : ''}`}
          style={{ borderColor: 'var(--danger-border)' }}
        >
          Suspended Accounts ({getCounts('suspended')})
        </button>
      </div>

      {/* Directory Table Grid */}
      <div className="glass-panel" style={{ padding: '2px', overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Clinic & Primary Practitioner</th>
                <th>Security Email</th>
                <th>Onboarded At</th>
                <th>Access Status</th>
                <th style={{ textAlign: 'right' }}>Administrative Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClinics.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>No clinics match the filter criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClinics.map((clinic) => (
                  <tr key={clinic.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-title)', fontSize: '14.5px' }}>
                          {clinic.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          {clinic.practitioner}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-title)' }}>
                        {clinic.email}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>
                        {formatDate(clinic.created_at)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${clinic.status}`}>
                        {clinic.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {/* Approve Action */}
                        {clinic.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(clinic.id, clinic.name, 'active')}
                            disabled={processingId === clinic.id}
                            className="btn btn-success"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                            }}
                          >
                            {processingId === clinic.id ? 'Approving...' : 'Approve Workspace'}
                          </button>
                        )}

                        {/* Suspend Action */}
                        {clinic.status !== 'suspended' && (
                          <button
                            onClick={() => handleUpdateStatus(clinic.id, clinic.name, 'suspended')}
                            disabled={processingId === clinic.id}
                            className="btn btn-danger"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              opacity: 0.9
                            }}
                          >
                            {processingId === clinic.id ? 'Suspending...' : 'Suspend'}
                          </button>
                        )}

                        {/* Activate Action */}
                        {clinic.status === 'suspended' && (
                          <button
                            onClick={() => handleUpdateStatus(clinic.id, clinic.name, 'active')}
                            disabled={processingId === clinic.id}
                            className="btn btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              borderRadius: '6px'
                            }}
                          >
                            {processingId === clinic.id ? 'Reactivating...' : 'Re-Activate'}
                          </button>
                        )}
                      </div>
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
export default TenantDirectory
