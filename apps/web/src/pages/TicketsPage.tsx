import { Link, useSearchParams } from 'react-router-dom'
import { getSessionUser, isAdmin, isAgent } from '../lib/role'
import {
  useAgents,
  useAssignTicket,
  useTicketList,
} from '../features/tickets/hooks/useTicketQueries'
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
} from '../features/tickets/types'
import CategoryBadge from '../features/tickets/components/CategoryBadge'
import StatusBadge from '../features/tickets/components/StatusBadge'
import Pagination from '../features/tickets/components/Pagination'
import { EmptyState, ErrorState, LoadingState } from '../features/tickets/components/StateMessage'

const PAGE_SIZE = 10

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.find((a) => a === value)
}

function getCustomerLabel(ticket: Ticket): string | null {
  return ticket.customerName ||
    ticket.customer?.name ||
    ticket.createdBy?.name ||
    ticket.customerEmail ||
    ticket.customer?.email ||
    ticket.createdBy?.email ||
    null
}

function getAssigneeLabel(ticket: Ticket): string {
  return ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'
}

export default function TicketsPage() {
  const user = getSessionUser()
  const adminView = isAdmin(user?.role)
  const agentView = isAgent(user?.role)

  const [searchParams, setSearchParams] = useSearchParams()

  // Page aur filters URL mein rehte hain (refresh/share karne pe bhi wahi result)
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const status = parseEnum(searchParams.get('status'), TICKET_STATUSES)
  const priority = parseEnum(searchParams.get('priority'), TICKET_PRIORITIES)
  const category = parseEnum(searchParams.get('category'), TICKET_CATEGORIES)

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useTicketList({
    page,
    pageSize: PAGE_SIZE,
    status,
    priority,
    category,
  })

  const { data: agents = [] } = useAgents(adminView)

  function setParam(key: 'status' | 'priority' | 'category' | 'page', value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page') // filter badalte hi page 1 pe jao
    setSearchParams(next)
  }

  const tickets = data?.data ?? []
  const assignedUsersCount = new Set(
    tickets
      .map((t) => t.customerId || t.customer?.id || t.customerEmail || t.customer?.email)
      .filter((v): v is string => Boolean(v))
  ).size
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length

  const selectClass = 'ml-2 border border-[#888c8c] rounded px-2 py-1 text-sm bg-white'

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-normal">
          {adminView ? 'All tickets' : agentView ? 'Assigned tickets' : 'Your tickets'}
        </h1>
        <Link
          to="/tickets/new"
          className="bg-amz-yellow hover:bg-amz-yellow-dark border border-[#fcd200] rounded-full px-4 py-1.5 text-sm"
        >
          New ticket
        </Link>
      </div>

      {agentView && !adminView && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-amz-border rounded-lg p-3.5">
            <p className="text-xs text-slate-500">Customers on this page</p>
            <p className="text-xl font-semibold mt-1">{assignedUsersCount}</p>
          </div>
          <div className="bg-white border border-amz-border rounded-lg p-3.5">
            <p className="text-xs text-slate-500">In progress</p>
            <p className="text-xl font-semibold mt-1">{inProgressCount}</p>
          </div>
          <div className="bg-white border border-amz-border rounded-lg p-3.5">
            <p className="text-xs text-slate-500">Resolved</p>
            <p className="text-xl font-semibold mt-1">{resolvedCount}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4">
        <label className="text-sm">
          Status
          <select className={selectClass} value={status ?? ''} onChange={(e) => setParam('status', e.target.value)}>
            <option value="">All</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Priority
          <select className={selectClass} value={priority ?? ''} onChange={(e) => setParam('priority', e.target.value)}>
            <option value="">All</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Category
          <select className={selectClass} value={category ?? ''} onChange={(e) => setParam('category', e.target.value)}>
            <option value="">All</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </label>
      </div>

      {isPending ? (
        <LoadingState label="Loading tickets..." />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets found"
          hint={
            status || priority || category
              ? 'Try changing or clearing the filters.'
              : 'Create a ticket to get started.'
          }
        />
      ) : (
        <>
          <ul
            aria-busy={isPlaceholderData}
            className={`bg-white border border-amz-border rounded-lg divide-y divide-amz-border ${isPlaceholderData ? 'opacity-50' : ''}`}
          >
            {tickets.map((t) => {
              const ticketTitle = t.title || t.subject || 'Untitled ticket'
              const customerLabel = getCustomerLabel(t)

              return (
                <li key={t.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="text-amz-link hover:text-amz-link-hover hover:underline font-medium"
                      >
                        {ticketTitle}
                      </Link>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <CategoryBadge category={t.category} />
                      <span>
                        {t.priority ?? 'P3'}
                        {t.createdAt ? ` · ${new Date(t.createdAt).toLocaleDateString()}` : ''}
                        {adminView && customerLabel ? ` · Customer: ${customerLabel}` : ''}
                        {adminView ? ` · Assignee: ${getAssigneeLabel(t)}` : ''}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {adminView && (
                      <AdminAssignSelect ticket={t} agents={agents} selectClass={selectClass} />
                    )}
                    <StatusBadge status={t.status} />
                  </div>
                </li>
              )
            })}
          </ul>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={(p) => setParam('page', String(p))} />
        </>
      )}
    </section>
  )
}

function AdminAssignSelect({
  ticket,
  agents,
  selectClass,
}: {
  ticket: Ticket
  agents: Array<{ id: string; name?: string | null; email?: string | null }>
  selectClass: string
}) {
  const assignMutation = useAssignTicket(ticket.id)
  const currentAssigneeId = ticket.assigneeId || ticket.assignee?.id || ''

  return (
    <label className="text-xs text-slate-600 flex items-center">
      Assign
      <select
        className={selectClass}
        value={currentAssigneeId}
        disabled={assignMutation.isPending}
        onChange={(e) => {
          assignMutation.mutate(e.target.value || null)
        }}
      >
        <option value="">Unassigned</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name || agent.email || agent.id}
          </option>
        ))}
      </select>
      {assignMutation.isError && (
        <span role="alert" className="text-[#c40000]">
          Could not assign agent: {assignMutation.error.message}
        </span>
      )}
    </label>
  )
}