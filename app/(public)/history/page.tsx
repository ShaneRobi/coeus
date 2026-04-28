import BottomNav from '@/components/BottomNav'
import HomeTabs from '@/components/HomeTabs'

export default function HistoryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <HomeTabs />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-sm font-medium text-text-secondary">Past events archive</h1>
          <span className="text-xs text-text-muted">0 events</span>
        </div>
        <div className="rounded-xl border-[0.5px] border-border bg-bg-card p-8 text-center text-sm text-text-secondary">
          Events you have attended will appear here.
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
