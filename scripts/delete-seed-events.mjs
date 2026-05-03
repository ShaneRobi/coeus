import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const SEED_TITLES = [
  'NUS Hack & Roll 2026',
  'NTU Career Fair Spring 2026',
  'SP Open House 2026',
  'SMU Fintech Innovation Workshop',
  'NUS Inter-Faculty Futsal Tournament',
  'SUTD AI & Robotics Demo Day',
  'NYP Open House 2026',
  'SIT UX Design Bootcamp',
  'NTU x NUS Inter-University Swimming Gala',
  'TP Startup Pitch Night',
]

const { data, error } = await supabase
  .from('events')
  .delete()
  .in('title', SEED_TITLES)
  .select('id, title')

if (error) {
  console.error('Delete failed:', error.message)
  process.exit(1)
}

if (!data.length) {
  console.log('No matching seed events found (already deleted or never inserted).')
} else {
  console.log(`Deleted ${data.length} seed events:`)
  data.forEach(e => console.log(` ✓ ${e.title} (${e.id})`))
}
