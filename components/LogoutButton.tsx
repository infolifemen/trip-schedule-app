'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    // AuthGate автоматически заметит потерю сессии и редиректнет на /login
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        background: 'transparent',
        color: '#6b7280',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#f3f4f6'
        e.currentTarget.style.color = '#1f2937'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = '#6b7280'
      }}
    >
      {loading ? 'Выход...' : 'Выйти'}
    </button>
  )
}
