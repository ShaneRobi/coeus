import AdminQueue from '@/components/AdminQueue'

export default function AdminPage() {
  return (
    <div className="min-h-[calc(100vh-53px)] bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Admin</h1>
          <nav className="flex gap-4 text-sm text-text-secondary">
            <a href="/admin" className="text-text-primary">Queue</a>
            <a href="/admin/users" className="hover:text-text-primary transition-colors">Users</a>
            <a href="/admin/scrapers" className="hover:text-text-primary transition-colors">Scrapers</a>
          </nav>
        </div>
        <AdminQueue />
      </div>
    </div>
  )
}
