import { describe, it, expect, vi } from 'vitest'

const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
})

import { toQuery, createTicket } from './api/tickets.api'
import { createTicketSchema } from './schemas'
import { ApiError } from '../../lib/api-client'

describe('toQuery', () => {
  it('skips empty values', () => {
    expect(toQuery({ page: 2, status: undefined, priority: '' })).toBe('?page=2')
  })
})

describe('createTicketSchema (shared with API)', () => {
  // ⚠️ Valid input apne schema ke hisaab se badlo
  it('accepts valid input', () => {
    const r = createTicketSchema.safeParse({
      title: 'Printer broken',
      description: 'It does not print',
      category: 'Hardware',
      priority: 'P2',
    })
    expect(r.success).toBe(true)
  })
  it('rejects invalid input', () => {
    const r = createTicketSchema.safeParse({ title: '', description: '', priority: 'X' })
    expect(r.success).toBe(false)
  })
})

describe('createTicket', () => {
  it('throws ApiError with backend message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Title is too short' } }), { status: 400 }),
    ))
    await expect(createTicket({ title: 'x', description: 'y', priority: 'P1' } as never)).rejects.toMatchObject({
      status: 400,
      message: 'Title is too short',
    })
    await expect(createTicket({} as never)).rejects.toBeInstanceOf(ApiError)
  })
})