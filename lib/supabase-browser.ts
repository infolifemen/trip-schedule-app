import { createBrowserClient } from '@supabase/ssr'

// Fallback values если env vars не установлены
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tchdcqflcfuhsgqaquzn.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaGRjcWZsY2Z1aHNncWFxdXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODM4NDksImV4cCI6MjEwNjk1OTg0OX0.c0Z1ILIISm0zRcY79V8tbjUKY7bzQa17RFBanaAVFnU'

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}
