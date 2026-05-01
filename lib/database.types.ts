export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string
          start_at: string
          end_at: string | null
          location_name: string
          location_address: string
          coordinates: Json | null
          image_url: string | null
          external_url: string | null
          source: string
          source_id: string | null
          tags: string[]
          category: string
          status: string
          is_free: boolean
          price_min: number | null
          price_max: number | null
          organiser_name: string | null
          organiser_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          start_at: string
          end_at?: string | null
          location_name: string
          location_address: string
          coordinates?: Json | null
          image_url?: string | null
          external_url?: string | null
          source: string
          source_id?: string | null
          tags?: string[]
          category: string
          status?: string
          is_free: boolean
          price_min?: number | null
          price_max?: number | null
          organiser_name?: string | null
          organiser_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_at?: string
          end_at?: string | null
          location_name?: string
          location_address?: string
          coordinates?: Json | null
          image_url?: string | null
          external_url?: string | null
          source?: string
          source_id?: string | null
          tags?: string[]
          category?: string
          status?: string
          is_free?: boolean
          price_min?: number | null
          price_max?: number | null
          organiser_name?: string | null
          organiser_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          interests: string[]
          is_admin: boolean
          role: 'normal_user' | 'admin' | 'super_admin'
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          interests?: string[]
          is_admin?: boolean
          role?: 'normal_user' | 'admin' | 'super_admin'
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          interests?: string[]
          is_admin?: boolean
          role?: 'normal_user' | 'admin' | 'super_admin'
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          id: string
          user_id: string
          event_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          status?: string
        }
        Relationships: []
      }
      scraper_runs: {
        Row: {
          id: string
          source: string
          started_at: string
          finished_at: string | null
          events_found: number
          events_added: number
          error: string | null
          status: string
        }
        Insert: {
          id?: string
          source: string
          started_at: string
          finished_at?: string | null
          events_found: number
          events_added: number
          error?: string | null
          status: string
        }
        Update: {
          id?: string
          source?: string
          started_at?: string
          finished_at?: string | null
          events_found?: number
          events_added?: number
          error?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'normal_user' | 'admin' | 'super_admin'
    }
    CompositeTypes: Record<string, never>
  }
}
