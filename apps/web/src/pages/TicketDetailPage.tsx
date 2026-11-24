import { Link, useLocation, useParams } from 'react-router-dom'
import { getRole, isAdmin, isStaff } from '../lib/role'
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

function getCategoryLabel(category?: string | null): string | null {
  if (!category) return null
  return CATEGORY_LABELS[category as TicketCategory] ?? category
}

export default function TicketDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const justCreated = (location.state as { created?: boolean } | null)?.created

  const role = getRole()
  const adminView = isAdmin(role)
  const canManage = isStaff(role) // sirf UI hint, asli check backend karta hai

  const ticketQuery = useTicket(id)
  const commentsQuery = useComments(id)
  const statusMutation = useUpdateTicketStatus(id)
  const assignMutation = useAssignTicket(id)
  const { data: agents = [] } = useAgents(adminView)

  const ticket = ticketQuery.data
  const categoryLabel = getCategoryLabel(ticket?.category)
  const currentAssigneeId = ticket?.assigneeId || ticket?.assignee?.id || ''

  return (
    <section className="space-y-6">
      <Link to="/" className="text-sm text-amz-link hover:underline">
        ← Back to tickets
      </Link>

      {justCreated && (
       <p role="status" className="border border-green-600 bg-green-50 text-green-800 text-sm rounded-lg p-3">
          Ticket created.
        </p>
      )}

      {ticketQuery.isPending ? (
        <LoadingState label="Loading ticket..." />
      ) : ticketQuery.isError ? (
        <ErrorState error={ticketQuery.error} onRetry={() => ticketQuery.refetch()} />
      ) : !ticket ? (
        <EmptyState title="Ticket not found" />
      ) : (
        <div className="bg-white border border-amz-border rounded-lg p-5 space-y-3">
          {canManage && ticketQuery.isSuccess && <AiAssistPanel ticketId={id} />}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-normal">{ticket.title || ticket.subject || 'Untitled ticket'}</h1>
              {adminView && categoryLabel && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {categoryLabel}
                </span>
              )}
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          <p className="text-xs text-slate-500">
            {ticket.priority ?? 'P3'}
            {ticket.createdAt ? ` · Created ${new Date(ticket.createdAt).toLocaleString()}` : ''}
            {adminView && (ticket.customerName || ticket.customer?.name || ticket.createdBy?.name || ticket.customerEmail || ticket.customer?.email || ticket.createdBy?.email)
              ? ` · Customer: ${ticket.customerName || ticket.customer?.name || ticket.createdBy?.name || ticket.customerEmail || ticket.customer?.email || ticket.createdBy?.email}`
              : ''}
            {adminView
              ? ` · Assignee: ${ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}`
              : ''}
          </p>

          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>

          {(canManage || adminView) && (
            <div className="pt-3 border-t border-amz-border flex flex-wrap items-center gap-4">
              {canManage && (
                <label className="text-sm">
                  Change status
                  <select
                    className="ml-2 border border-[#888c8c] rounded px-2 py-1 text-sm bg-white"
                    value={ticket.status}
                    disabled={statusMutation.isPending}
                    onChange={(e) => statusMutation.mutate(e.target.value as TicketStatus)}
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {adminView && (
                <label className="text-sm">
                  Assign agent
                  <select
                    className="ml-2 border border-[#888c8c] rounded px-2 py-1 text-sm bg-white"
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
                </label>
              )}
              {assignMutation.isError && (
                <p role="alert" className="text-sm text-[#c40000]">
                  Could not assign agent: {assignMutation.error.message}
                </p>
              )}

              {statusMutation.isError && (
                <p role="alert" className="text-sm text-[#c40000]">
                  {statusMutation.error.message}
                </p>
              )}
              {assignMutation.isError && (
                <p role="alert" className="text-sm text-[#c40000]">
                  {assignMutation.error.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {id && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Comments</h2>

          <AddCommentForm ticketId={id} />

          {commentsQuery.isPending ? (
            <LoadingState label="Loading comments..." />
          ) : commentsQuery.isError ? (
            <ErrorState error={commentsQuery.error} onRetry={() => commentsQuery.refetch()} />
          ) : commentsQuery.data.length === 0 ? (
            <EmptyState title="No comments yet" />
          ) : (
            <ul className="space-y-3">
              {commentsQuery.data.map((c) => (
                <li key={c.id} className="bg-white border border-amz-border rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-medium text-amz-text">
                      {c.author?.name ?? c.author?.email ?? 'Unknown'}
                    </span>
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                    {c.isInternal && (
                      <span className="bg-amber-100 text-amber-800 rounded px-1.5 py-0.5">
                        Internal
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}