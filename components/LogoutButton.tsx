'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const { signOut } = useAuth()

  return (
    <button
      onClick={signOut}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        background: "rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        color: "#5a5a72",
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.background = "rgba(220,38,38,0.08)";
        (e.target as HTMLElement).style.color = "#dc2626";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.background = "rgba(0,0,0,0.04)";
        (e.target as HTMLElement).style.color = "#5a5a72";
      }}
    >
      <LogOut size={14} />
      Выйти
    </button>
  )
}
