import { createServiceClient } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'
import { getRoleLabel } from '@/lib/roles'

export default async function AdminUsersPage() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  const users = (data ?? []) as unknown as UserProfile[]

  return (
    <div className="min-h-[calc(100vh-53px)] bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Users</h1>
          <nav className="flex gap-4 text-sm text-text-secondary">
            <a href="/admin" className="hover:text-text-primary transition-colors">Queue</a>
            <a href="/admin/users" className="text-text-primary">Users</a>
            <a href="/admin/scrapers" className="hover:text-text-primary transition-colors">Scrapers</a>
          </nav>
        </div>

        <div className="rounded-xl border-[0.5px] border-border overflow-hidden bg-bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-secondary font-normal">Name</th>
                <th className="text-left px-4 py-3 text-text-secondary font-normal">Joined</th>
                <th className="text-left px-4 py-3 text-text-secondary font-normal">Role</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-primary">{u.display_name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(u.created_at).toLocaleDateString('en-SG')}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {getRoleLabel(u.role)}
                  </td>
                </tr>
              ))}
              {!users?.length && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
