'use client'

import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'
import HomeTabs from '@/components/HomeTabs'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function MapPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <HomeTabs />
      <main className="flex-1 pb-16">
        <MapView />
      </main>
      <BottomNav />
    </div>
  )
}
