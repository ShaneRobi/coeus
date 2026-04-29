'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import type { Event } from '@/lib/types'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default marker icons for Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198]

export default function MapView() {
  const [events, setEvents] = useState<Event[]>([])
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    fetch('/api/events?limit=100')
      .then((r) => r.json())
      .then((data: Event[]) => setEvents(data.filter((e) => e.coordinates)))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const updateTheme = () => setDarkMode(!root.classList.contains('theme-light'))
    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="h-[calc(100vh-120px)] w-full">
      <MapContainer
        center={SINGAPORE_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%', background: darkMode ? '#232321' : '#F5F4F0' }}
        attributionControl={false}
      >
        <TileLayer
          key={darkMode ? 'dark-map' : 'light-map'}
          url={`https://{s}.basemaps.cartocdn.com/${darkMode ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`}
          attribution='&copy; OpenStreetMap &amp; CARTO'
        />
        {events.map((event) => {
          if (!event.coordinates) return null
          return (
            <Marker key={event.id} position={[event.coordinates.lat, event.coordinates.lng]}>
              <Popup>
                <div className="text-xs space-y-1">
                  <strong>{event.title}</strong>
                  <div>{event.location_name}</div>
                  <a href={`/events/${event.id}`} className="text-accent">View</a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
