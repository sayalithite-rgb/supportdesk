import { tokenStorage } from './api-client'

// ⚠️ Role ke naam requireRole.ts / jwt.ts se confirm karo
const STAFF_ROLES = ['AGENT', 'ADMIN']
const USER_KEY = 'supportdesk_user'

type StoredUser = { name?: string; email?: string; role?: string }

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function decodePayload(): Record<string, unknown> | null {
  const token = tokenStorage.get()
  if (!token) return null
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(part)) as Record<string, unknown>
  } catch {
    return null
  }
}

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as StoredUser) : null
  } catch {
    return null
  }
}

// Login ke baad call hota hai. Backend ne data.user diya to wo, warna form ka email.
export function saveSessionUser(data: Record<string, unknown>, fallbackEmail: string) {
  const o = data.user && typeof data.user === 'object' ? (data.user as Record<string, unknown>) : {}
  const user: StoredUser = {
    name: str(o.name) ?? str(o.fullName) ?? str(o.username),
    email: str(o.email) ?? fallbackEmail,
    role: str(o.role),
  }
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* storage unavailable: ignore */
  }
}

export function clearSessionUser() {
  try {
    localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

export function getRole(): string | null {
  return str(decodePayload()?.role) ?? readStoredUser()?.role ?? null
}

export function isStaff(role: string | null): boolean {
  return role !== null && STAFF_ROLES.includes(role)
}

export function getSessionUser(): { name: string; email: string | null; role: string | null } {
  const payload = decodePayload()
  const stored = readStoredUser()
  const email = str(payload?.email) ?? stored?.email ?? null
  const name = str(payload?.name) ?? stored?.name ?? email?.split('@')[0] ?? 'User'
  return { name, email, role: getRole() }
}