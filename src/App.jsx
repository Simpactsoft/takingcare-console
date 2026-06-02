import React, { useState } from 'react'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './components/Login'
import { ToastContainer } from './components/Toast'

// Core Modules
import Dashboard from './components/Dashboard'
import TenantDirectory from './components/TenantDirectory'
import BillingAudit from './components/BillingAudit'
import AphorismCMS from './components/AphorismCMS'
import NotificationPanel from './components/NotificationPanel'

// Inner app coordinator requiring Auth Context
const ConsoleApp = ({ addToast }) => {
  const { user, loading } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')

  // Full page spinner during initial auth evaluation
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: 'var(--bg-color)',
        gap: '16px'
      }}>
        <div className="spinner"></div>
        <p style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text-title)',
          letterSpacing: '0.01em',
          fontFamily: 'var(--font-sans)'
        }}>
          Verifying security authorization signatures...
        </p>
      </div>
    )
  }

  // Enforce authentication & Super-Admin whitelisting
  if (!user) {
    return <Login />
  }

  // Active module page title mapper
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Supervisor Platform Control'
      case 'tenants':
        return 'Tenant Approvals Hub'
      case 'billing':
        return 'Global Billing & Financial Audit Log'
      case 'aphorisms':
        return 'Daily Aphorism Content CMS'
      case 'broadcast':
        return 'Practitioner Email Broadcast Panel'
      default:
        return 'Administrative Workspace'
    }
  }

  // Active Tab content Switcher
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard addToast={addToast} />
      case 'tenants':
        return <TenantDirectory addToast={addToast} searchQuery={searchQuery} />
      case 'billing':
        return <BillingAudit addToast={addToast} searchQuery={searchQuery} />
      case 'aphorisms':
        return <AphorismCMS addToast={addToast} searchQuery={searchQuery} />
      case 'broadcast':
        return <NotificationPanel addToast={addToast} />
      default:
        return <Dashboard addToast={addToast} />
    }
  }

  return (
    <div className="app-container">
      {/* Dynamic layout components */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="main-content">
        <Header 
          title={getPageTitle()} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
        {renderTabContent()}
      </div>
    </div>
  )
}

// Master wrapper mounting toast aggregates and Auth contexts
export default function App() {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    const id = String(Date.now() + Math.random())
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <AdminAuthProvider addToast={addToast}>
      <ConsoleApp addToast={addToast} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminAuthProvider>
  )
}
