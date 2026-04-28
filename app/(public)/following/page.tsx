import BottomNav from '@/components/BottomNav'
import HomeTabs from '@/components/HomeTabs'
import FilterChips from '@/components/FilterChips'

export default function FollowingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <HomeTabs />
      <FilterChips />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24">
        <div className="py-12 text-center text-text-secondary text-sm">
          Sign in to see events from organisers you follow.
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
