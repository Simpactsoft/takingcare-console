import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, allowedEmails } from '../supabase'

const AdminAuthContext = createContext(null)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  return context
}

export const AdminAuthProvider = ({ children, addToast }) => {
  // If Supabase is not configured, we start in Demo mode.
  // Otherwise, user can explicitly switch to demo or start with live.
  const [isDemo, setIsDemo] = useState(!isSupabaseConfigured)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Live Supabase Auth Listener
  useEffect(() => {
    if (isDemo || !supabase) {
      // Check local storage for mock active session
      const storedMockUser = localStorage.getItem('takingcare_console_mock_user')
      if (storedMockUser) {
        setUser(JSON.parse(storedMockUser))
      }
      setLoading(false)
      return
    }

    setLoading(true)
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthSession(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await handleAuthSession(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [isDemo])

  // Whitelist checking & Auth handler
  const handleAuthSession = async (currUser) => {
    const email = currUser.email?.toLowerCase().trim()
    
    if (allowedEmails.includes(email)) {
      setUser({
        id: currUser.id,
        email: currUser.email,
        name: currUser.user_metadata?.full_name || email.split('@')[0],
        avatar_url: currUser.user_metadata?.avatar_url,
        isLive: true
      })
      setAuthError(null)
    } else {
      // Unauthorised: Force sign-out instantly!
      setAuthError(`Access Denied: ${currUser.email} is not in the Super-Admin whitelist.`)
      setUser(null)
      if (addToast) {
        addToast(`Security Alert: Unauthorized access attempt by ${currUser.email}`, 'danger')
      }
      await supabase.auth.signOut()
    }
    setLoading(false)
  }

  // Login handler
  const login = async (email, password) => {
    setLoading(true)
    setAuthError(null)
    const normalizedEmail = email.toLowerCase().trim()

    if (isDemo) {
      // Demo Login logic
      if (allowedEmails.includes(normalizedEmail)) {
        const mockUser = {
          id: 'mock-admin-1',
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0].replace(/^\w/, c => c.toUpperCase()) + ' (Demo)',
          isLive: false
        }
        setUser(mockUser)
        localStorage.setItem('takingcare_console_mock_user', JSON.stringify(mockUser))
        if (addToast) addToast(`Welcome back, ${mockUser.name}! (Sandbox Mode)`, 'success')
        setLoading(false)
        return true
      } else {
        setAuthError(`Access Denied: ${normalizedEmail} is not in the Super-Admin whitelist.`)
        if (addToast) addToast('Access denied: Email not whitelisted.', 'danger')
        setLoading(false)
        return false
      }
    } else {
      // Live Login logic
      if (!allowedEmails.includes(normalizedEmail)) {
        setAuthError(`Access Denied: ${normalizedEmail} is not in the Super-Admin whitelist.`)
        if (addToast) addToast('Access denied: Email not whitelisted.', 'danger')
        setLoading(false)
        return false
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      })

      if (error) {
        setAuthError(error.message)
        if (addToast) addToast(`Auth Error: ${error.message}`, 'danger')
        setLoading(false)
        return false
      }
      return true
    }
  }

  // Logout handler
  const logout = async () => {
    setLoading(true)
    if (isDemo) {
      setUser(null)
      localStorage.removeItem('takingcare_console_mock_user')
      if (addToast) addToast('Signed out of Sandbox session.', 'info')
    } else {
      if (supabase) {
        await supabase.auth.signOut()
        if (addToast) addToast('Signed out of takingcare.app console.', 'info')
      }
    }
    setUser(null)
    setLoading(false)
  }

  const toggleDemoMode = () => {
    setIsDemo(prev => {
      const target = !prev
      if (target) {
        // Toggle into demo: clear active live user
        setUser(null)
        if (addToast) addToast('Switched to Persisted Sandbox Database', 'info')
      } else {
        // Toggle to live
        setUser(null)
        if (!isSupabaseConfigured) {
          if (addToast) addToast('Supabase is not configured. Please check VITE_SUPABASE_URL.', 'danger')
          return prev // stay in demo
        }
        if (addToast) addToast('Switched to Live Supabase Connection', 'info')
      }
      return target
    })
  }

  return (
    <AdminAuthContext.Provider value={{
      user,
      loading,
      authError,
      isDemo,
      isSupabaseConfigured,
      login,
      logout,
      toggleDemoMode
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
