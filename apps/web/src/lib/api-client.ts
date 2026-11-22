// Dev mein khali string: requests localhost:5174 par jayengi aur Vite proxy forward karega.
// Production mein VITE_API_BASE_URL use hoga.
const BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL as string)

const TOKEN_KEY = 'supportdesk_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Called when a protected request returns 401 (expired/invalid token)
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

// Backend envelope: { data, error: { code, message } | null, meta }
type Envelope<T, M = unknown> = {
  data: T | null
  error: { code?: string; message?: string } | null
  meta?: M
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  // On the login request, 401 means "wrong password", not "session expired"
  skipAuthRedirect?: boolean
}

async function request<T, M = unknown>(
  path: string,
  { method = 'GET', body, skipAuthRedirect = false }: RequestOptions = {},
): Promise<Envelope<T, M>> {
  const token = tokenStorage.get()

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Please try again later.')
  }

  const json = (await res.json().catch(() => null)) as Envelope<T, M> | null

  if (!res.ok) {
    if (res.status === 401 && !skipAuthRedirect) {
      onUnauthorized?.()
    }
    throw new ApiError(
      res.status,
      json?.error?.message ?? `Request failed (HTTP ${res.status}). Please try again.`,
      json?.error?.code,
    )
  }

  if (json === null) {
    throw new ApiError(res.status, 'Unexpected response from the server.')
  }
  return json
}

export async function apiRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  const json = await request<T>(path, options)
  if (json.data === null || json.data === undefined) {
    throw new ApiError(200, 'Unexpected response from the server.')
  }
  return json.data
}

// For list endpoints: returns data AND meta (pagination)
export async function apiRequestWithMeta<T, M = unknown>(
  path: string,
  options?: RequestOptions,
): Promise<{ data: T; meta: M }> {
  const json = await request<T, M>(path, options)
  if (json.data === null || json.data === undefined) {
    throw new ApiError(200, 'Unexpected response from the server.')
  }
  return { data: json.data, meta: json.meta as M }
}