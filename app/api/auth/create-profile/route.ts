import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { userId, displayName, school } = await req.json()

  if (!userId || !displayName) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { error } = await serviceClient.from('profiles').insert({
    id: userId,
    display_name: displayName,
    bio: school || null,
    interests: [],
    is_admin: false,
    role: 'normal_user',
  })

  // 23505 = unique_violation (profile already exists — safe to ignore)
  if (error && error.code !== '23505') {
    console.error('Profile creation error:', error)
    return NextResponse.json({ error: 'Failed to create profile.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
