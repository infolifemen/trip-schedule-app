'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

/**
 * Клиентская проверка авторизации через Supabase Auth.
 * Работает и на Vercel (SSR), и на GitHub Pages (статика).
 * Проверяет наличие активной сессии Supabase (JWT).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Получаем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthorized(true)
      } else {
        router.replace('/login')
      }
    })

    // Подписываемся на изменения аутентификации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthorized(false)
        router.replace('/login')
      } else {
        setAuthorized(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (authorized === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0eeeb',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#6b7280',
          fontSize: 14,
        }}
      >
        Проверка авторизации…
      </div>
    )
  }

  return <>{children}</>
}
