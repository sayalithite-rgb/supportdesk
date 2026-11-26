import { Link } from 'react-router-dom'
import CategoryBadge from '../features/tickets/components/CategoryBadge'
import { ErrorState, LoadingState } from '../features/tickets/components/StateMessage'
import { useTicketList, useUpdateTicketStatus } from '../features/tickets/hooks/useTicketQueries'
import { getSessionUser } from '../lib/role'
import { TICKET_PRIORITIES, type Ticket, type TicketStatus } from '../features/tickets/types'

// ⚠️ Status values schema.prisma ke enum se match karo
const COLUMNS: { key: string; title: string; statuses: TicketStatus[] }[] = [
  { key: 'todo', title: 'To do', statuses: ['open'] },
  { key: 'doing', title: 'In progress', statuses: ['in_progress'] },
  { key: 'waiting', title: 'Waiting on customer', statuses: ['waiting_on_customer'] },
  { key: 'done', title: 'Done', statuses: ['resolved', 'closed'] },
]

const NEXT_STEP: Record<TicketStatus, string> = {
  open: 'Review the request and reply to the customer',
  in_progress: 'Keep working and post an update',
  waiting_on_customer: 'Waiting for the customer to respond',
  resolved: 'Confirm with the customer, then close',
  closed: 'No action needed',
}

// Ek-click status buttons. Allowed transitions backend decide karta hai, error neeche dikhega.
const ACTIONS: Partial<Record<TicketStatus, { label: string; to: TicketStatus }[]>> = {
  open: [{ label: 'Start work', to: 'in_progress' }],
  in_progress: [
    { label: 'Waiting on customer', to: 'waiting_on_customer' },
    { label: 'Mark resolved', to: 'resolved' },
  ],
  waiting_on_customer: [{ label: 'Resume work', to: 'in_progress' }],
  resolved: [{ label: 'Close ticket', to: 'closed' }],
}

function daysSince(iso?: string) {
  if (!iso) return null
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

function WorkCard({ ticket }: { ticket: Ticket }) {
  const mutation = useUpdateTicketStatus(ticket.id)
  const customerName =
    ticket.customer?.name ||
    ticket.customerName ||
    ticket.createdBy?.name ||
    ticket.customer?.email ||
    ticket.customerEmail ||
    ticket.createdBy?.email ||
    'Unknown customer'
  const customerEmail = ticket.customer?.email || ticket.customerEmail || ticket.createdBy?.email
  const agentName = ticket.assignee?.name || ticket.assignee?.email || 'You'
  const days = daysSince(ticket.createdAt)
  const active = ticket.status !== 'resolved' && ticket.status !== 'closed'

  return (
    <li className="bg-white border border-amz-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/tickets/${ticket.id}`} className="text-sm font-medium text-amz-link hover:text-amz-link-hover hover:underline">
          {ticket.title}
        </Link>
        <span className="text-xs font-bold">{ticket.priority}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <CategoryBadge category={ticket.category} />
        <span>{days === null ? 'Date unavailable' : days === 0 ? 'Today' : `${days}d old`}</span>
        {active && days !== null && days >= 3 && (
          <span className="bg-amber-100 text-amber-800 rounded px-1.5">Aging</span>
        )}
      </div>

      <p className="text-xs">
        <span className="text-slate-500">Customer: </span>
        <span className="font-medium">{customerName}</span>
        {customerEmail && <span className="text-slate-500"> ({customerEmail})</span>}
      </p>

      <p className="text-xs">
        <span className="text-slate-500">Assigned agent: </span>
        <span className="font-medium">{agentName}</span>
      </p>

      <p className="text-xs text-slate-600 border-l-2 border-amz-orange pl-2">
        Next: {NEXT_STEP[ticket.status]}
      </p>

      {(ACTIONS[ticket.status] ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(ACTIONS[ticket.status] ?? []).map((a) => (
            <button
              key={a.to}
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(a.to)}
              className="text-xs border border-amz-border rounded-full px-3 py-1 hover:border-amz-orange disabled:opacity-60"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      {mutation.isError && <p role="alert" className="text-xs text-[#c40000]">{mutation.error.message}</p>}
    </li>
  )
}

export default function MyWorkPage() {
  const userId = getSessionUser().id
  const { data, isPending, isError, error, refetch } = useTicketList({
    page: 1,
    pageSize: 50,
    assigneeId: userId ?? undefined,
  }, Boolean(userId))

  const tickets = data?.data ?? []
  const priorityRank = (priority?: string) => {
    const rank = TICKET_PRIORITIES.findIndex((value) => value === priority)
    return rank < 0 ? TICKET_PRIORITIES.length : rank
  }
  const sorted = [...tickets].sort((a, b) =>
    priorityRank(a.priority) - priorityRank(b.priority) ||
    (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
  )
  const active = sorted.filter((t) => t.status !== 'resolved' && t.status !== 'closed')
  const waiting = sorted.filter((t) => t.status === 'waiting_on_customer')

  return (
    <section>
      <h1 className="text-3xl font-bold">My work</h1>
      <p className="text-slate-600 mt-1">Tickets assigned to you, highest priority and oldest first.</p>

      {!userId ? (
        <p role="alert" className="mt-6 text-sm text-[#c40000]">
          Could not identify your user session. Please sign in again.
        </p>
      ) : isPending ? (
        <div className="mt-6"><LoadingState label="Loading your tickets..." /></div>
      ) : isError ? (
        <div className="mt-6"><ErrorState error={error} onRetry={() => refetch()} /></div>
      ) : tickets.length === 0 ? (
        <div className="mt-6 bg-white border border-amz-border rounded-lg p-8 text-center">
          <p className="font-medium">No tickets assigned to you yet</p>
          <p className="text-sm text-slate-600 mt-1">When an admin assigns a ticket, it will show up here.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="bg-white border border-amz-border rounded-full px-3 py-1">
              <strong>{active.length}</strong> active
            </span>
            <span className="bg-white border border-amz-border rounded-full px-3 py-1">
              <strong>{waiting.length}</strong> waiting on customers
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
              const items = sorted.filter((t) => col.statuses.includes(t.status))
              return (
                <div key={col.key} className="bg-slate-100 rounded-xl p-3">
                  <h2 className="text-sm font-bold mb-2 flex justify-between">
                    {col.title}
                    <span className="text-slate-500">{items.length}</span>
                  </h2>
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Nothing here</p>
                  ) : (
                    <ul className="space-y-3">
                      {items.map((t) => (
                        <WorkCard key={t.id} ticket={t} />
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}