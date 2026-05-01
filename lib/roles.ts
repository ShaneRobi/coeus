import type { UserRole } from './types'

export const ROLE_LABELS: Record<UserRole, string> = {
  normal_user: 'User',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function isSuperAdmin(role: UserRole | undefined | null): boolean {
  return role === 'super_admin'
}

export function canAccessAdmin(role: UserRole | undefined | null): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function getRoleLabel(role: UserRole | undefined | null): string {
  if (!role) return 'User'
  return ROLE_LABELS[role] ?? 'User'
}
