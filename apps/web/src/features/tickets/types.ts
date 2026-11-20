// ⚠️ schema.prisma ke TicketStatus enum se EXACT match karo (saari values)
export const TICKET_STATUSES = [
  'open',
  'in_progress',
  'waiting_on_customer',
  'resolved',
  'closed',
] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

// Record<TicketStatus, ...> ka fayda: enum mein koi status add ho aur label na ho to TypeScript error dega
export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting_on_customer: 'Waiting on customer',
  resolved: 'Resolved',
  closed: 'Closed',
}

// ⚠️ Step 0.3 ke asli response se fields match karo
export type Ticket = {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
}

// ⚠️ Backend ke comment response se match karo
export type TicketComment = {
  id: string
  body: string
  createdAt: string
  author?: { name?: string; email?: string }
  isInternal?: boolean
}

// ⚠️ Backend ke meta se match karo
export type PageMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type TicketListParams = {
  page: number
  pageSize: number
  status?: TicketStatus
  priority?: TicketPriority
}