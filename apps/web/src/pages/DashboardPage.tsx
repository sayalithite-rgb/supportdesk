import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import StatusBadge from '../features/tickets/components/StatusBadge'
import CategoryBadge from '../features/tickets/components/CategoryBadge'
import { ErrorState, LoadingState } from '../features/tickets/components/StateMessage'
import { useTicketCounts, useTicketList } from '../features/tickets/hooks/useTicketQueries'
import { getSessionUser, isStaff } from '../lib/role'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const user = getSessionUser()
  const staff = isStaff(user.role) // sirf text ke liye, asli access backend decide karta hai
  const [total, open, inProgress, resolved] = useTicketCounts()
  const recent = useTicketList({ page: 1, pageSize: 5 })

  const rate =
    total.data && resolved.data !== undefined ? Math.round((resolved.data / total.data) * 100) : null

  // ⚠️ Status values (open, in_progress, resolved) schema.prisma ke enum se match karo
  const cards = [
    { label: 'Total tickets', hint: 'All support requests', icon: 'clipboard', to: '/tickets', q: total },
    { label: 'Open tickets', hint: 'Awaiting resolution', icon: 'clock', to: '/tickets?status=open', q: open },
    { label: 'In progress', hint: 'Currently being handled', icon: 'refresh', to: '/tickets?status=in_progress', q: inProgress },
    { label: 'Resolved', hint: 'Successfully completed', icon: 'check', to: '/tickets?status=resolved', q: resolved },
  ] as const

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            {greeting()}, {user.name}. Here is {staff ? 'the support queue' : 'your support activity'} at a glance.
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="bg-amz-yellow hover:bg-amz-yellow-dark border border-[#fcd200] rounded-full px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amz-orange"
        >
          + New ticket
        </Link>
      </div>

      <h2 className="text-xl font-bold mt-8">Ticket overview</h2>
      <p className="text-sm text-slate-600 mb-4">
        {staff ? 'Summary of all support tickets' : 'Summary of your support tickets'}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            hint={c.hint}
            icon={c.icon}
            to={c.to}
            value={c.q.data}
            isLoading={c.q.isPending}
            isError={c.q.isError}
          />
        ))}
      </div>

      {rate !== null && (
        <div className="mt-4 bg-white border border-amz-border rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span>Resolution rate</span>
            <span className="font-bold">{rate}%</span>
          </div>
          <div
            className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden"
            role="progressbar"
            aria-label="Resolution rate"
            aria-valuenow={rate}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-amz-orange" style={{ width: `${rate}%` }} />
          </div>
        </div>
      )}

      <section className="mt-8 bg-white border border-amz-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Recent tickets</h2>
            <p className="text-sm text-slate-600">
              {staff ? 'Latest requests from customers' : 'Your latest support requests'}
            </p>
          </div>
          <Link to="/tickets" className="text-sm font-medium text-amz-link hover:text-amz-link-hover hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          {recent.isPending ? (
            <LoadingState label="Loading tickets..." />
          ) : recent.isError ? (
            <ErrorState error={recent.error} onRetry={() => recent.refetch()} />
          ) : recent.data.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No ticket data available yet.{' '}
              <Link to="/tickets/new" className="text-amz-link hover:underline">Create your first ticket</Link>
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-amz-border">
                  <th scope="col" className="py-2 pr-4 font-semibold">Ticket</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Subject</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Category</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                  <th scope="col" className="py-2 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {recent.data.data.map((t) => (
                  <tr key={t.id} className="border-b border-amz-border last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">#{String(t.id).slice(0, 8)}</td>
                    <td className="py-3 pr-4">
                      <Link to={`/tickets/${t.id}`} className="text-amz-link hover:text-amz-link-hover hover:underline font-medium">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4"><CategoryBadge category={t.category} /></td>
                    <td className="py-3 pr-4"><StatusBadge status={t.status} /></td>
                    <td className="py-3">{t.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}