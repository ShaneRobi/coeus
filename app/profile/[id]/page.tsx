import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'

interface Props {
  params: { id: string }
}

async function getProfile(id: string): Promise<UserProfile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  return data as UserProfile | null
}

export default async function PublicProfilePage({ params }: Props) {
  const profile = await getProfile(params.id)
  if (!profile) notFound()

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-bg-card border border-border flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#888780" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="8" r="4" />
                <path d="M3 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-text-primary font-semibold">{profile.display_name}</p>
            {profile.bio && <p className="text-text-secondary text-sm mt-0.5">{profile.bio}</p>}
          </div>
        </div>

        {profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span key={interest} className="px-2 py-0.5 rounded text-xs bg-bg-card text-text-secondary border border-border">
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
