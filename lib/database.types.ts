export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      specialists: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          specialist_id: string       // legacy (deprecated)
          specialist_ids: string      // JSON array: '["АДА","ККА"]'
          city: string
          purpose: string
          equipment: string
          start_date: string
          end_date: string
          note: string
          created_at: string
        }
        Insert: {
          id: string
          specialist_id?: string
          specialist_ids?: string
          city: string
          purpose?: string
          equipment?: string
          start_date: string
          end_date: string
          note?: string
          created_at?: string
        }
        Update: {
          id?: string
          specialist_id?: string
          specialist_ids?: string
          city?: string
          purpose?: string
          equipment?: string
          start_date?: string
          end_date?: string
          note?: string
          created_at?: string
        }
      }
      service_periods: {
        Row: {
          id: string
          object_id: string
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          id: string
          object_id: string
          start_date: string
          end_date: string
          created_at?: string
        }
        Update: {
          id?: string
          object_id?: string
          start_date?: string
          end_date?: string
          created_at?: string
        }
      }
      vacations: {
        Row: {
          id: string
          specialist_id: string
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          id: string
          specialist_id: string
          start_date: string
          end_date: string
          created_at?: string
        }
        Update: {
          id?: string
          specialist_id?: string
          start_date?: string
          end_date?: string
          created_at?: string
        }
      }
    }
  }
}
