'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// Singleton Supabase client
let _supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars не настроены')
    _supabaseClient = createBrowserClient(url, key)
  }
  return _supabaseClient
}

// Auth context
type AuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // На /login — пропускаем проверку авторизации (моментальная загрузка)
    if (pathname === '/login') {
      setLoading(false)
      return
    }

    const supabase = getSupabaseClient()

    // Timeout: если getSession не отвечает за 5 сек — продолжаем
    const timeout = setTimeout(() => {
      setLoading(false)
      console.warn('[AuthProvider] getSession timeout — продолжаем без сессии')
    }, 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setLoading(false)

      // Редирект на /login если не авторизован
      if (!currentUser) {
        router.replace('/login')
      }
    }).catch((err) => {
      clearTimeout(timeout)
      console.error('[AuthProvider] getSession error:', err)
      setLoading(false)
      router.replace('/login')
    })
  }, [pathname])

  const signOut = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
    } catch (e) {
      // ignore
    }
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
