import { Link, useSearchParams } from 'react-router-dom'
import { useTicketList } from '../features/tickets/hooks/useTicketQueries'
import {
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../features/tickets/types'
import StatusBadge from '../features/tickets/components/StatusBadge'
import Pagination from '../features/tickets/components/Pagination'
import { EmptyState, ErrorState, LoadingState } from '../features/tickets/components/StateMessage'

const PAGE_SIZE = 10

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.find((a) => a === value)
}

export default function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Page aur filters URL mein rehte hain (refresh/share karne pe bhi wahi result)
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const status = parseEnum(searchParams.get('status'), TICKET_STATUSES)
  const priority = parseEnum(searchParams.get('priority'), TICKET_PRIORITIES)

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useTicketList({
    page,
    pageSize: PAGE_SIZE,
    status,
    priority,
  })

  function setParam(key: 'status' | 'priority' | 'page', value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page') // filter badalte hi page 1 pe jao
    setSearchParams(next)
  }

  const selectClass = 'ml-2 border border-[#888c8c] rounded px-2 py-1 text-sm bg-white'

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-normal">Your tickets</h1>
        <Link
          to="/tickets/new"
          className="bg-amz-yellow hover:bg-amz-yellow-dark border border-[#fcd200] rounded-full px-4 py-1.5 text-sm"
        >
          New ticket
        </Link>
      </div>

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
      </div>

      {isPending ? (
        <LoadingState label="Loading tickets..." />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          title="No tickets found"
          hint={status || priority ? 'Try changing or clearing the filters.' : 'Create a ticket to get started.'}
        />
      ) : (
        <>
          <ul
            aria-busy={isPlaceholderData}
            className={`bg-white border border-amz-border rounded-lg divide-y divide-amz-border ${isPlaceholderData ? 'opacity-50' : ''}`}
          >
            {data.data.map((t) => (
              <li key={t.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/tickets/${t.id}`} className="text-amz-link hover:text-amz-link-hover hover:underline font-medium">
                    {t.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.priority} · {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={(p) => setParam('page', String(p))} />
        </>
      )}
    </section>
  )
}