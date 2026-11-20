import { Link, useLocation, useParams } from 'react-router-dom'
import { useComments, useTicket, useUpdateTicketStatus } from '../features/tickets/hooks/useTicketQueries'
import { STATUS_LABELS, TICKET_STATUSES, type TicketStatus } from '../features/tickets/types'
import StatusBadge from '../features/tickets/components/StatusBadge'
import AddCommentForm from '../features/tickets/components/AddCommentForm'
import { EmptyState, ErrorState, LoadingState } from '../features/tickets/components/StateMessage'
import { getRole, isStaff } from '../lib/role'

export default function TicketDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const justCreated = (location.state as { created?: boolean } | null)?.created

  const ticketQuery = useTicket(id)
  const commentsQuery = useComments(id)
  const statusMutation = useUpdateTicketStatus(id)
  const canManage = isStaff(getRole()) // sirf UI hint, asli check backend karta hai

  return (
    <section className="space-y-6">
     <Link to="/" className="text-sm text-amz-link hover:underline">← Back to tickets</Link>

      {justCreated && (
        <p role="status" className="border border-green-600 bg-green-50 text-green-800 text-sm rounded-lg p-3">
          Ticket created.
        </p>
      )}

      {ticketQuery.isPending ? (
        <LoadingState label="Loading ticket..." />
      ) : ticketQuery.isError ? (
        <ErrorState error={ticketQuery.error} onRetry={() => ticketQuery.refetch()} />
      ) : (
        <div className="bg-white border border-amz-border rounded-lg p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-2xl font-normal">{ticketQuery.data.title}</h1>
            <StatusBadge status={ticketQuery.data.status} />
          </div>
          <p className="text-xs text-slate-500">
            {ticketQuery.data.priority} · Created {new Date(ticketQuery.data.createdAt).toLocaleString()}
          </p>
          <p className="text-sm whitespace-pre-wrap">{ticketQuery.data.description}</p>

          {canManage && (
            <div className="pt-3 border-t border-amz-border">
              <label className="text-sm">
                Change status
                <select
                  className="ml-2 border border-[#888c8c] rounded px-2 py-1 text-sm bg-white"
                  value={ticketQuery.data.status}
                  disabled={statusMutation.isPending}
                  onChange={(e) => statusMutation.mutate(e.target.value as TicketStatus)}
                >
                  {TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </label>
              {statusMutation.isError && (
                <p role="alert" className="text-sm text-[#c40000] mt-1">{statusMutation.error.message}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Comments</h2>
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
                  <span className="font-medium text-amz-text">{c.author?.name ?? c.author?.email ?? 'Unknown'}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                  {c.isInternal && <span className="bg-amber-100 text-amber-800 rounded px-1.5">Internal</span>}
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.body}</p>
              </li>
            ))}
          </ul>
        )}

        {ticketQuery.isSuccess && <AddCommentForm ticketId={id} />}
      </div>
    </section>
  )
}