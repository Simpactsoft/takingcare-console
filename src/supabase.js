import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const allowedEmailsEnv = import.meta.env.VITE_ALLOWED_ADMIN_EMAILS || ''

// Parse allowed admin emails
export const allowedEmails = allowedEmailsEnv
  ? allowedEmailsEnv.split(',').map(email => email.trim().toLowerCase())
  : ['admin@takingcare.app', 'super@takingcare.app']

// Check if Supabase credentials are valid
export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey

// Initialize Supabase client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// --- PERSISTED MOCK DATABASE FOR SANDBOX / DEMO RUNS ---
const STORAGE_PREFIX = 'takingcare_console_mock_'

const MOCK_SEED_CLINICS = [
  { id: '1', name: 'Mind & Body Wellness Clinic', practitioner: 'Dr. Sarah Jenkins', email: 'sarah.j@wellness.org', status: 'pending', created_at: '2026-05-28T09:30:00Z' },
  { id: '2', name: 'Downtown Cognitive Therapy', practitioner: 'Marcus Sterling, LMFT', email: 'm.sterling@downtowntherapy.com', status: 'active', created_at: '2026-04-12T14:15:00Z' },
  { id: '3', name: 'Aura Psychiatric Group', practitioner: 'Dr. Evelyn Patel', email: 'contact@aurapsych.com', status: 'pending', created_at: '2026-06-01T10:00:00Z' },
  { id: '4', name: 'Summit Neuro-Counselling', practitioner: 'David Vance, PhD', email: 'vance@summitcounsel.net', status: 'active', created_at: '2025-11-05T08:00:00Z' },
  { id: '5', name: 'Ocean Breeze Therapy Center', practitioner: 'Clara Oswald, LCSW', email: 'clara@oceanbreezetx.com', status: 'suspended', created_at: '2025-08-20T16:45:00Z' },
  { id: '6', name: 'Restorative Psychology Collective', practitioner: 'Dr. Alan Grant', email: 'a.grant@restorativepsy.org', status: 'pending', created_at: '2026-05-30T11:20:00Z' }
]

const MOCK_SEED_LEDGER = [
  { id: 'TX-9021', tenant_name: 'Downtown Cognitive Therapy', amount: 450.00, status: 'paid', invoice_date: '2026-05-01', method: 'Stripe Credit' },
  { id: 'TX-9022', tenant_name: 'Summit Neuro-Counselling', amount: 890.00, status: 'paid', invoice_date: '2026-05-15', method: 'Direct ACH' },
  { id: 'TX-9023', tenant_name: 'Ocean Breeze Therapy Center', amount: 350.00, status: 'overdue', invoice_date: '2026-04-20', method: 'Stripe Credit' },
  { id: 'TX-9024', tenant_name: 'Downtown Cognitive Therapy', amount: 450.00, status: 'paid', invoice_date: '2026-06-01', method: 'Stripe Credit' },
  { id: 'TX-9025', tenant_name: 'Summit Neuro-Counselling', amount: 890.00, status: 'outstanding', invoice_date: '2026-06-01', method: 'Direct ACH' },
  { id: 'TX-9026', tenant_name: 'Mind & Body Wellness Clinic', amount: 150.00, status: 'outstanding', invoice_date: '2026-06-02', method: 'Pending Setup' }
]

const MOCK_SEED_APHORISMS = [
  { id: '1', text: 'Healing is not linear; give yourself the grace to step forward, pause, and breathe.', author: 'Dr. Marcus Sterling', category: 'Mindfulness', rating_thumbs_up: 45, rating_thumbs_down: 2 },
  { id: '2', text: 'The greatest weapon against stress is our ability to choose one thought over another.', author: 'William James', category: 'Cognitive', rating_thumbs_up: 120, rating_thumbs_down: 8 },
  { id: '3', text: 'Your feelings are valid. You do not need to justify them to feel them.', author: 'Clara Oswald, LCSW', category: 'Self-Compassion', rating_thumbs_up: 89, rating_thumbs_down: 1 },
  { id: '4', text: 'We cannot change what we are not aware of, and once we are aware, we cannot help but change.', author: 'Sheryl Sandberg', category: 'Awareness', rating_thumbs_up: 56, rating_thumbs_down: 4 },
  { id: '5', text: 'You are worthy of support, not because you are productive, but because you are human.', author: 'Daily Compassion', category: 'General', rating_thumbs_up: 210, rating_thumbs_down: 3 }
]

const MOCK_SEED_METRICS = {
  total_sessions: 14820,
  revenue_collected: 2180.00,
  revenue_outstanding: 1040.00
}

// Local Storage Helper
const getOrSetLocal = (key, seedData) => {
  const fullKey = STORAGE_PREFIX + key
  const val = localStorage.getItem(fullKey)
  if (val) return JSON.parse(val)
  localStorage.setItem(fullKey, JSON.stringify(seedData))
  return seedData
}

const saveLocal = (key, data) => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
}

// Database client mock
export const dbMock = {
  getClinics: () => getOrSetLocal('clinics', MOCK_SEED_CLINICS),
  updateClinicStatus: (id, status) => {
    const clinics = dbMock.getClinics()
    const index = clinics.findIndex(c => c.id === id)
    if (index !== -1) {
      clinics[index].status = status
      saveLocal('clinics', clinics)
      return { success: true, clinic: clinics[index] }
    }
    return { success: false, error: 'Clinic not found' }
  },

  getLedger: () => getOrSetLocal('ledger', MOCK_SEED_LEDGER),
  
  getAphorisms: () => getOrSetLocal('aphorisms', MOCK_SEED_APHORISMS),
  addAphorisms: (newQuotes) => {
    const quotes = dbMock.getAphorisms()
    const formatted = newQuotes.map((q, idx) => ({
      id: String(quotes.length + idx + 1),
      rating_thumbs_up: 0,
      rating_thumbs_down: 0,
      ...q
    }))
    const updated = [...formatted, ...quotes] // newest first
    saveLocal('aphorisms', updated)
    return { success: true, quotes: formatted }
  },
  updateAphorism: (id, text, author, category) => {
    const quotes = dbMock.getAphorisms()
    const index = quotes.findIndex(q => q.id === id)
    if (index !== -1) {
      quotes[index] = { ...quotes[index], text, author, category }
      saveLocal('aphorisms', quotes)
      return { success: true, quote: quotes[index] }
    }
    return { success: false, error: 'Quote not found' }
  },
  deleteAphorism: (id) => {
    const quotes = dbMock.getAphorisms()
    const filtered = quotes.filter(q => q.id !== id)
    saveLocal('aphorisms', filtered)
    return { success: true }
  },

  getMetrics: () => {
    const clinics = dbMock.getClinics()
    const seedMetrics = getOrSetLocal('metrics', MOCK_SEED_METRICS)
    
    return {
      totalClinics: clinics.length,
      activeClinics: clinics.filter(c => c.status === 'active').length,
      pendingClinics: clinics.filter(c => c.status === 'pending').length,
      suspendedClinics: clinics.filter(c => c.status === 'suspended').length,
      totalSessions: seedMetrics.total_sessions,
      revenueCollected: seedMetrics.revenue_collected,
      revenueOutstanding: seedMetrics.revenue_outstanding
    }
  },

  sendBroadcast: (subject, preview, body) => {
    const broadcasts = getOrSetLocal('broadcasts', [])
    const newBroadcast = {
      id: String(broadcasts.length + 1),
      subject,
      preview,
      body,
      sent_at: new Date().toISOString(),
      recipients: dbMock.getClinics().filter(c => c.status === 'active').length
    }
    broadcasts.unshift(newBroadcast)
    saveLocal('broadcasts', broadcasts)
    return { success: true, broadcast: newBroadcast }
  }
}
