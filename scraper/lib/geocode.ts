import axios from 'axios'
import type { Coordinates } from '@/lib/types'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const res = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: {
        q: `${address}, Singapore`,
        format: 'json',
        limit: 1,
        countrycodes: 'sg',
      },
      headers: { 'User-Agent': 'coeus-events-app/1.0' },
    })

    const results = res.data as Array<{ lat: string; lon: string }>
    if (!results.length) return null

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    }
  } catch {
    return null
  }
}
