import { tokenStorage } from './api-client'

// Role ke naam requireRole.ts / jwt.ts se confirm karo
const STAFF_ROLES = ['AGENT', 'ADMIN']
const USER_KEY = 'supportdesk_user'

export type StoredUser = {
  id?: string
  name?: string
  email?: string
  role?: string
}

export type SessionUser = {
  id: string | null
  name: string
  email: string | null
  role: string | null
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function decodePayload(): Record<string, unknown> | null {
  const token = tokenStorage.get()
  if (!token) return null
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = part + '='.repeat((4 - (part.length % 4)) % 4)
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return null
    return {
      id: str(parsed.id),
      name: str(parsed.name),
      email: str(parsed.email),
      role: str(parsed.role),
    }
  } catch {
    return null
  }
}

// Login ke baad call hota hai. Backend ne data.user diya to wo, warna form ka email.
export function saveSessionUser(data: Record<string, unknown>, fallbackEmail: string) {
  const o = data.user && typeof data.user === 'object' ? (data.user as Record<string, unknown>) : {}
  const user: StoredUser = {
    id: str(o.id) ?? str(data.id),
    name: str(o.name) ?? str(o.fullName) ?? str(o.username),
    email: str(o.email) ?? fallbackEmail,
    role: str(o.role) ?? str(data.role),
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

// Stored user pehle, JWT fallback. Role hamesha uppercase normalize hota hai.
export function getRole(): string | null {
  return readStoredUser()?.role ?? str(decodePayload()?.role) ?? null
}

// Hamesha object return karta hai (Layout jaise components ko .name chahiye)
export function getSessionUser(): SessionUser {
  const stored = readStoredUser()
  const payload = decodePayload()
  const email = stored?.email ?? str(payload?.email) ?? null
  const name = stored?.name ?? str(payload?.name) ?? email?.split('@')[0] ?? 'User'
  const role = stored?.role ?? str(payload?.role) ?? null
  const id = stored?.id ?? str(payload?.sub) ?? str(payload?.id) ?? null
  return { id, name, email, role }
}

function normalizeRole(role?: string | null): string {
  return (role ?? getRole() ?? '').trim().toUpperCase()
}

export function isAdmin(role?: string | null): boolean {
  return normalizeRole(role) === 'ADMIN'
}

export function isAgent(role?: string | null): boolean {
  return normalizeRole(role) === 'AGENT'
}

export function isCustomer(role?: string | null): boolean {
  return normalizeRole(role) === 'CUSTOMER'
}

export function isStaff(role?: string | null): boolean {
  return STAFF_ROLES.includes(normalizeRole(role))
}