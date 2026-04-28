import EventFeed from '@/components/EventFeed'
import FilterChips from '@/components/FilterChips'
import BottomNav from '@/components/BottomNav'
import HomeTabs from '@/components/HomeTabs'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <HomeTabs />
      <FilterChips />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24">
        <EventFeed />
      </main>
      <BottomNav />
    </div>
  )
}
