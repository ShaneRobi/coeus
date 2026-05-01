export type UserRole = 'normal_user' | 'admin' | 'super_admin'

export type EventCategory =
  | 'tech'
  | 'arts'
  | 'sports'
  | 'music'
  | 'food'
  | 'business'
  | 'education'
  | 'community'
  | 'hackathon'
  | 'career'
  | 'workshop'
  | 'social'
  | 'open_house'
  | 'other'

export type EventStatus = 'pending' | 'published' | 'approved' | 'rejected'

export type RsvpStatus = 'going' | 'interested' | 'not_going' | null

export interface Coordinates {
  lat: number
  lng: number
}

export interface Event {
  id: string
  title: string
  description: string
  start_at: string
  end_at: string | null
  location_name: string
  location_address: string
  coordinates: Coordinates | null
  image_url: string | null
  external_url: string | null
  source: string
  source_id: string | null
  tags: string[]
  category: EventCategory
  status: EventStatus
  is_free: boolean
  price_min: number | null
  price_max: number | null
  organiser_name: string | null
  organiser_id: string | null
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  interests: EventCategory[]
  /** @deprecated use role instead */
  is_admin: boolean
  role: UserRole
  created_at: string
}

export interface Rsvp {
  id: string
  user_id: string
  event_id: string
  status: RsvpStatus
  created_at: string
}

export interface ScraperRun {
  id: string
  source: string
  started_at: string
  finished_at: string | null
  events_found: number
  events_added: number
  error: string | null
  status: 'running' | 'success' | 'error'
}

export interface SubmitPayload {
  title: string
  description: string
  start_at: string
  end_at?: string
  location_name: string
  location_address: string
  external_url?: string
  is_free: boolean
  price_min?: number
  price_max?: number
  category: EventCategory
  tags: string[]
  organiser_name?: string
  submitter_email: string
}

export interface FilterState {
  categories: EventCategory[]
  dateRange: 'today' | 'week' | 'month' | 'all'
  isFree: boolean | null
  tags: string[]
  search: string
}
