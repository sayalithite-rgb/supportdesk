import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import TicketSearchAndOverview from '../features/tickets/components/TicketSearchAndOverview'
import StatusBadge from '../features/tickets/components/StatusBadge'
import type { Ticket, TicketPriority } from '../features/tickets/types'
import { useTicketCounts, useTicketList } from '../features/tickets/hooks/useTicketQueries'
import { getSessionUser, isAdmin, isAgent } from '../lib/role'

type CreatedTicketNotice = {
  id: string
  title: string
  status: Ticket['status']
  priority?: TicketPriority | string
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const user = getSessionUser()
  const location = useLocation()
  const navigate = useNavigate()
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const role = isAdmin(user.role) ? 'admin' : isAgent(user.role) ? 'agent' : 'customer'
  const [total, open, inProgress, resolved, closed] = useTicketCounts()
  const recent = useTicketList({ page: 1, pageSize: 100 })
  const state = location.state as { createdTicket?: CreatedTicketNotice } | null
  const createdTicket = state?.createdTicket

  function dismissCreatedNotice() {
    setNoticeDismissed(true)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }

  return (
    <div>
      {createdTicket && !noticeDismissed && (
        <section
          role="status"
          aria-live="polite"
          className="mb-6 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700" aria-hidden="true">
              ✓
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">Ticket submitted</h2>
              <p className="mt-1 break-words text-sm text-slate-600">
                <span className="font-medium text-slate-800">#{createdTicket.id.slice(0, 8)}</span>
                {' · '}
                {createdTicket.title}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={createdTicket.status} />
                {createdTicket.priority && (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {createdTicket.priority}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex shrink-0 items-center gap-3 sm:mt-0">
            <Link
              to={`/tickets/${createdTicket.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amz-yellow px-4 text-sm font-semibold text-amz-navy hover:bg-amz-yellow-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amz-orange"
            >
              View ticket
            </Link>
            <button
              type="button"
              onClick={dismissCreatedNotice}
              aria-label="Dismiss ticket confirmation"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amz-orange"
            >
              ×
            </button>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-slate-600">
            {greeting()}, {user.name}. Here is {role === 'customer' ? 'your support activity' : 'the support queue'} at a glance.
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="rounded-full border border-[#fcd200] bg-amz-yellow px-5 py-2 text-sm font-medium hover:bg-amz-yellow-dark focus:outline-none focus:ring-2 focus:ring-amz-orange"
        >
          + New ticket
        </Link>
      </div>

      <h2 className="mt-8 text-xl font-bold">Ticket overview</h2>
      <p className="mb-4 text-sm text-slate-600">
        {role === 'customer' ? 'Summary of your support tickets' : 'Summary of all support tickets'}
      </p>

      <TicketSearchAndOverview
        tickets={recent.data?.data ?? []}
        role={role}
        counts={{
          total: { value: total.data, isLoading: total.isPending, isError: total.isError },
          open: { value: open.data, isLoading: open.isPending, isError: open.isError },
          inProgress: { value: inProgress.data, isLoading: inProgress.isPending, isError: inProgress.isError },
          resolved: { value: resolved.data, isLoading: resolved.isPending, isError: resolved.isError },
          closed: { value: closed.data, isLoading: closed.isPending, isError: closed.isError },
        }}
        isLoading={recent.isPending}
        isError={recent.isError}
        error={recent.error}
        onRetry={() => void recent.refetch()}
      />
    </div>
  )
}
