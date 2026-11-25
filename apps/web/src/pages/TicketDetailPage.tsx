import { Link, useLocation, useParams } from 'react-router-dom'
import { getRole, isAdmin, isAgent, isStaff } from '../lib/role'
import {
  useAgents,
  useAssignTicket,
  useComments,
  useTicket,
  useUpdateTicketStatus,
} from '../features/tickets/hooks/useTicketQueries'
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  TICKET_STATUSES,
  type TicketCategory,
  type TicketStatus,
} from '../features/tickets/types'
import StatusBadge from '../features/tickets/components/StatusBadge'
import AddCommentForm from '../features/tickets/components/AddCommentForm'
import { EmptyState, ErrorState, LoadingState } from '../features/tickets/components/StateMessage'
import AiAssistPanel from '../features/tickets/components/AiAssistPanel'
import './TicketDetailPage.css'

function getCategoryLabel(category?: string | null): string | null {
  if (!category) return null
  return CATEGORY_LABELS[category as TicketCategory] ?? category
}

function priorityLabel(priority?: string) {
  if (priority === 'P1') return 'Urgent'
  if (priority === 'P2') return 'High'
  if (priority === 'P3') return 'Normal'
  if (priority === 'P4') return 'Low'
  return 'Unspecified'
}

function slaLabel(slaDueAt?: string | null, status?: TicketStatus) {
  if (!slaDueAt) return 'SLA not configured'
  const due = new Date(slaDueAt)
  if (Number.isNaN(due.getTime())) return 'SLA date unavailable'
  if (status === 'resolved' || status === 'closed') {
    return `SLA deadline: ${due.toLocaleString()}`
  }
  const remaining = due.getTime() - Date.now()
  if (remaining <= 0) return `Overdue by ${Math.floor(Math.abs(remaining) / 60_000)}m`
  const minutes = Math.floor(remaining / 60_000)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `Due in ${hours}h ${rest}m` : `Due in ${rest}m`
}

function CustomerIcon() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20a7 7 0 0114 0" />
      </svg>
    </span>
  )
}

export default function TicketDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const justCreated = (location.state as { created?: boolean } | null)?.created

  const role = getRole()
  const adminView = isAdmin(role)
  const agentView = isAgent(role)
  const canManage = isStaff(role)

  const ticketQuery = useTicket(id)
  const commentsQuery = useComments(id)
  const statusMutation = useUpdateTicketStatus(id)
  const assignMutation = useAssignTicket(id)
  const { data: agents = [] } = useAgents(adminView)

  const ticket = ticketQuery.data
  const categoryLabel = getCategoryLabel(ticket?.category)
  const currentAssigneeId = ticket?.assigneeId || ticket?.assignee?.id || ''
  const customerName =
    ticket?.customer?.name ||
    ticket?.customerName ||
    ticket?.createdBy?.name ||
    'Customer'
  const customerEmail =
    ticket?.customer?.email ||
    ticket?.customerEmail ||
    ticket?.createdBy?.email

  if (ticketQuery.isPending) return <LoadingState label="Loading ticket..." />
  if (ticketQuery.isError) return <ErrorState error={ticketQuery.error} onRetry={() => void ticketQuery.refetch()} />
  if (!ticket) return <EmptyState title="Ticket not found" />

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link to="/tickets" className="text-amz-link hover:underline">Tickets</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="font-mono">{ticket.id.slice(0, 7).toUpperCase()}</span>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-slate-700">{ticket.title || ticket.subject || 'Ticket detail'}</span>
        </nav>
        <Link to="/tickets" className="text-sm text-amz-link hover:underline">← Back to tickets</Link>
      </div>

      {justCreated && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Ticket created successfully.
        </p>
      )}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <article className="rounded-xl border border-amz-border bg-white p-4 shadow-sm sm:p-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Ticket #{ticket.id.slice(0, 7).toUpperCase()}
                </p>
                <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {ticket.title || ticket.subject || 'Untitled ticket'}
                </h1>
              </div>
              <StatusBadge status={ticket.status} />
            </header>

            <div className="mt-5 flex min-w-0 items-center gap-3 rounded-lg bg-slate-50 p-3">
              <CustomerIcon />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{customerName}</p>
                <p className="truncate text-sm text-slate-500">{customerEmail || 'Customer email unavailable'}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-900">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                {ticket.priority ?? 'Priority unset'}{ticket.priority ? ` · ${priorityLabel(ticket.priority)}` : ''}
              </span>
              <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-medium ${
                ticket.status === 'resolved' || ticket.status === 'closed'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}>
                {slaLabel(ticket.slaDueAt, ticket.status)}
              </span>
              {adminView && categoryLabel && (
                <span className="inline-flex min-h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700">
                  {categoryLabel}
                </span>
              )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Description</h2>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {ticket.description || 'No description provided.'}
              </p>
            </div>
          </article>

          {canManage && ticketQuery.isSuccess && <AiAssistPanel ticketId={id} />}

          <section className="overflow-hidden rounded-xl border border-amz-border bg-white shadow-sm" aria-labelledby="comments-heading">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 id="comments-heading" className="text-lg font-semibold text-slate-900">Conversation</h2>
              <p className="mt-1 text-sm text-slate-500">Replies and updates about this ticket</p>
            </div>
            <div className="p-4 sm:p-6">
              <AddCommentForm ticketId={id} allowInternalNotes={agentView} />
            </div>

            <div className="border-t border-slate-100 px-4 py-4 sm:px-6">
              {commentsQuery.isPending ? (
                <LoadingState label="Loading comments..." />
              ) : commentsQuery.isError ? (
                <ErrorState error={commentsQuery.error} onRetry={() => void commentsQuery.refetch()} />
              ) : commentsQuery.data.length === 0 ? (
                <EmptyState title="No replies yet" hint="Start the conversation with a reply above." />
              ) : (
                <ul className="space-y-4">
                  {commentsQuery.data.map((comment) => (
                    <li key={comment.id} className={`rounded-lg border p-4 ${
                      comment.isInternal ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'
                    }`}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {comment.author?.name ?? comment.author?.email ?? 'Support team'}
                          </span>
                          {comment.isInternal && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                              Internal note
                            </span>
                          )}
                        </div>
                        <time className="text-xs text-slate-500" dateTime={comment.createdAt}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{comment.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start">
          <section className="rounded-xl border border-amz-border bg-white p-4 shadow-sm sm:p-5" aria-labelledby="properties-heading">
            <h2 id="properties-heading" className="text-base font-semibold text-slate-900">Ticket properties</h2>

            <div className="mt-4 space-y-4">
              {canManage && (
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <select
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-amz-orange focus:outline-none focus:ring-2 focus:ring-amz-orange/20"
                    value={ticket.status}
                    disabled={statusMutation.isPending}
                    onChange={(event) => statusMutation.mutate(event.target.value as TicketStatus)}
                  >
                    {TICKET_STATUSES.map((status) => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </label>
              )}

              {adminView && (
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned agent</span>
                  <select
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-amz-orange focus:outline-none focus:ring-2 focus:ring-amz-orange/20"
                    value={currentAssigneeId}
                    disabled={assignMutation.isPending}
                    onChange={(event) => assignMutation.mutate(event.target.value || null)}
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name || agent.email || agent.id}</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">Priority</span>
                <span className="font-semibold text-slate-800">{ticket.priority ?? 'Not set'} · {priorityLabel(ticket.priority)}</span>
              </div>
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-slate-500">Created</span>
                <span className="text-right font-medium text-slate-800">
                  {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Date unavailable'}
                </span>
              </div>
              {ticket.updatedAt && (
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-slate-500">Last updated</span>
                  <span className="text-right font-medium text-slate-800">{new Date(ticket.updatedAt).toLocaleString()}</span>
                </div>
              )}
              {ticket.slaDueAt && (
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-slate-500">SLA deadline</span>
                  <span className="text-right font-medium text-slate-800">{new Date(ticket.slaDueAt).toLocaleString()}</span>
                </div>
              )}
              {categoryLabel && (
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-slate-500">Category</span>
                  <span className="text-right font-medium text-slate-800">{categoryLabel}</span>
                </div>
              )}
            </div>

            {statusMutation.isError && <p role="alert" className="mt-3 text-sm text-red-700">{statusMutation.error.message}</p>}
            {assignMutation.isError && <p role="alert" className="mt-3 text-sm text-red-700">Could not assign agent: {assignMutation.error.message}</p>}
          </section>
        </aside>
      </div>
    </section>
  )
}
