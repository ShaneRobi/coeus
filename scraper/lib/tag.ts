import type { EventCategory } from '@/lib/types'

const CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
  hackathon: ['hackathon', 'hack & roll', 'hacking', 'buildathon', 'codeathon'],
  career: ['career', 'job fair', 'recruitment', 'internship', 'resume', 'hiring', 'employment'],
  workshop: ['workshop', 'bootcamp', 'training', 'hands-on', 'tutorial', 'class', 'course'],
  open_house: ['open house', 'campus tour', 'admissions', 'orientation'],
  tech: ['coding', 'developer', 'ai', 'machine learning', 'startup', 'tech', 'software', 'data', 'cyber', 'cloud', 'blockchain'],
  arts: ['art', 'gallery', 'exhibition', 'theatre', 'dance', 'film', 'photography', 'creative', 'design', 'craft'],
  sports: ['sports', 'run', 'marathon', 'fitness', 'yoga', 'gym', 'swim', 'cycle', 'football', 'basketball', 'tennis'],
  social: ['social', 'mixer', 'meetup', 'party', 'hangout', 'friends', 'gathering'],
  music: ['concert', 'gig', 'band', 'festival', 'jazz', 'classical', 'pop', 'edm', 'live music', 'choir'],
  food: ['food', 'dining', 'restaurant', 'tasting', 'cooking', 'culinary', 'buffet', 'market', 'hawker'],
  business: ['networking', 'conference', 'seminar', 'summit', 'forum', 'pitch', 'investment', 'entrepreneur'],
  education: ['lecture', 'talk', 'symposium', 'school', 'university', 'lecture'],
  community: ['community', 'volunteer', 'charity', 'social', 'neighbourhood', 'cultural', 'heritage', 'religious'],
  other: [],
}

export function inferCategory(title: string, description: string): EventCategory {
  const text = `${title} ${description}`.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [EventCategory, string[]][]) {
    if (category === 'other') continue
    if (keywords.some((kw) => text.includes(kw))) return category
  }

  return 'other'
}

export function extractTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const tags: string[] = []

  const allKeywords = Object.values(CATEGORY_KEYWORDS).flat()
  for (const kw of allKeywords) {
    if (text.includes(kw) && !tags.includes(kw)) {
      tags.push(kw)
    }
  }

  return tags.slice(0, 6)
}
