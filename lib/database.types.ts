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
          specialist_id: string
          city: string
          purpose: string
          start_date: string
          end_date: string
          note: string
          created_at: string
        }
        Insert: {
          id: string
          specialist_id: string
          city: string
          purpose?: string
          start_date: string
          end_date: string
          note?: string
          created_at?: string
        }
        Update: {
          id?: string
          specialist_id?: string
          city?: string
          purpose?: string
          start_date?: string
          end_date?: string
          note?: string
          created_at?: string
        }
      }
    }
  }
}
