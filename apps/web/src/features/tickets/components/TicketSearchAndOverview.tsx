import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon, type IconName } from '../../../components/Icon'
import StatusBadge from './StatusBadge'
import { STATUS_LABELS, TICKET_STATUSES, type Ticket, type TicketStatus } from '../types'

type CountState = { value?: number; isLoading: boolean; isError: boolean }
type DashboardRole = 'admin' | 'agent' | 'customer'

type Props = {
  tickets: Ticket[]
  role: DashboardRole
  counts: {
    total: CountState
    open: CountState
    inProgress: CountState
    resolved: CountState
    closed: CountState
  }
  isLoading: boolean
  isError: boolean
  error?: unknown
  onRetry: () => void
}

const FILTERS: Array<{ status?: TicketStatus; label: string }> = [
  { label: 'All' },
  { status: 'open', label: STATUS_LABELS.open },
  { status: 'in_progress', label: STATUS_LABELS.in_progress },
  { status: 'resolved', label: STATUS_LABELS.resolved },
  { status: 'closed', label: STATUS_LABELS.closed },
]

const CARDS: Array<{ label: string; icon: IconName; status?: TicketStatus; count: keyof Props['counts'] }> = [
  { label: 'Total tickets', icon: 'clipboard', count: 'total' },
  { label: 'Open tickets', icon: 'clock', status: 'open', count: 'open' },
  { label: 'In progress', icon: 'refresh', status: 'in_progress', count: 'inProgress' },
  { label: 'Resolved', icon: 'check', status: 'resolved', count: 'resolved' },
  { label: 'Closed', icon: 'check', status: 'closed', count: 'closed' },
]

function customerLabel(ticket: Ticket) {
  return ticket.customerName ||
    ticket.customer?.name ||
    ticket.createdBy?.name ||
    ticket.customerEmail ||
    ticket.customer?.email ||
    ticket.createdBy?.email ||
    'Unknown customer'
}

function matches(ticket: Ticket, term: string, role: DashboardRole) {
  if (!term) return true
  const shortId = ticket.id.slice(0, 8)
  const values: Array<string | null | undefined> = [
    ticket.id,
    shortId,
    `#${shortId}`,
    ticket.title,
    ticket.subject,
  ]
  if (role !== 'customer') {
    values.push(ticket.customerName, ticket.customer?.name, ticket.createdBy?.name)
    values.push(ticket.customerEmail, ticket.customer?.email, ticket.createdBy?.email)
  }
  if (role === 'admin') {
    values.push(ticket.assignee?.name, ticket.assignee?.email)
  }
  return values.some((value) => value?.toLowerCase().includes(term))
}

function priorityStyle(priority?: string) {
  if (priority === 'P1') return 'bg-red-50 text-red-700'
  if (priority === 'P2') return 'bg-amber-50 text-amber-800'
  return 'bg-slate-100 text-slate-700'
}

export default function TicketSearchAndOverview({
  tickets,
  role,
  counts,
  isLoading,
  isError,
  error,
  onRetry,
}: Props) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState(params.get('q') ?? '')
  const [filterOpen, setFilterOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const term = (params.get('q') ?? '').trim().toLowerCase()
  const requestedStatus = params.get('status')
  const activeStatus = TICKET_STATUSES.find(
    (status) => status !== 'waiting_on_customer' && status === requestedStatus,
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((current) => {
        const next = new URLSearchParams(current)
        if (searchValue.trim()) next.set('q', searchValue.trim())
        else next.delete('q')
        return next
      }, { replace: true })
    }, 200)
    return () => clearTimeout(timer)
  }, [searchValue, setParams])

  useEffect(() => {
    function onSlash(event: globalThis.KeyboardEvent) {
      const target = event.target
      if (
        event.key === '/' &&
        !(target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)))
      ) {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    document.addEventListener('keydown', onSlash)
    return () => document.removeEventListener('keydown', onSlash)
  }, [])

  useEffect(() => {
    if (!filterOpen) return

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !filterRef.current?.contains(event.target)) {
        setFilterOpen(false)
      }
    }

    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setFilterOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [filterOpen])

  useEffect(() => {
    setSearchValue(params.get('q') ?? '')
  }, [params])

  const filtered = useMemo(() => {
    const matching = tickets.filter((ticket) => matches(ticket, term, role))
    return activeStatus ? matching.filter((ticket) => ticket.status === activeStatus) : matching
  }, [tickets, term, role, activeStatus])

  const filteredCounts = useMemo(() => {
    const matching = tickets.filter((ticket) => matches(ticket, term, role))
    return {
      all: matching.length,
      open: matching.filter((ticket) => ticket.status === 'open').length,
      in_progress: matching.filter((ticket) => ticket.status === 'in_progress').length,
      resolved: matching.filter((ticket) => ticket.status === 'resolved').length,
      closed: matching.filter((ticket) => ticket.status === 'closed').length,
    }
  }, [tickets, term, role])

  function setStatus(status?: TicketStatus) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (status) next.set('status', status)
      else next.delete('status')
      return next
    })
  }

  function resetFilters() {
    setSearchValue('')
    setParams({})
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setSearchValue('')
      setParams((current) => {
        const next = new URLSearchParams(current)
        next.delete('q')
        return next
      }, { replace: true })
    }
  }

  const placeholder = role === 'admin'
    ? 'Search by ticket ID, subject, customer, or agent...'
    : role === 'customer'
      ? 'Search your tickets by ID or subject...'
      : 'Search by ticket ID, subject, or customer...'

  return (
    <>
      <div className="mb-5">
        <div className="flex w-full max-w-[330px] items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
          <label htmlFor="dashboard-ticket-search" className="sr-only">Search tickets</label>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6472]"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-4-4" />
          </svg>
          <input
            ref={searchInput}
            id="dashboard-ticket-search"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder={placeholder}
            className="h-11 w-full rounded-[9px] border border-[#D8DDE5] bg-white pl-9 pr-9 text-sm text-[#111] shadow-sm placeholder:text-[#8A919C] focus:border-[#F5A000] focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/30"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue('')}
              aria-label="Clear ticket search"
              className="absolute right-1 top-1/2 flex h-9 w-8 -translate-y-1/2 items-center justify-center rounded-full text-xl leading-none text-[#5B6472] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A000]"
            >×</button>
          )}
          </div>

          <div ref={filterRef} className="relative shrink-0">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((open) => !open)}
              className={`inline-flex h-11 min-w-[82px] items-center justify-center gap-2 rounded-[9px] border bg-white px-3 text-sm font-semibold text-[#252A31] shadow-sm transition hover:border-[#F5A000] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD60A]/50 ${
                activeStatus ? 'border-[#F5A000]' : 'border-[#D8DDE5]'
              }`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[17px] w-[17px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16l-6.2 7.1v5.2l-3.6 1.8v-7L4 5z" />
              </svg>
              Filter
              {activeStatus && <span aria-label="Filter active" className="h-1.5 w-1.5 rounded-full bg-[#F5A000]" />}
            </button>

            {filterOpen && (
              <div
                role="menu"
                aria-label="Filter tickets by status"
                className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-[#E3E7ED] bg-white p-1.5 shadow-lg"
              >
                {FILTERS.map((filter) => {
                  const selected = activeStatus === filter.status
                  const key = filter.status ?? 'all'
                  return (
                    <button
                      key={key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => {
                        setStatus(filter.status)
                        setFilterOpen(false)
                      }}
                      className={`flex min-h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm ${
                        selected ? 'bg-[#FFF8D6] font-semibold text-[#252A31]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {filter.label}
                      <span className="text-xs text-slate-500">{filteredCounts[key as keyof typeof filteredCounts]}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {CARDS.map((card) => {
          const selected = activeStatus === card.status
          const state = counts[card.count]
          const searchCountKey = card.count === 'total'
            ? 'all'
            : card.count === 'inProgress'
              ? 'in_progress'
              : card.count
          const displayCount = term ? filteredCounts[searchCountKey] : state.value
          return (
            <button
              key={card.label}
              type="button"
              aria-pressed={selected}
              onClick={() => setStatus(card.status)}
              className={`min-w-0 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#F5A000] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A000] ${
                selected ? 'border-[#F5A000] ring-1 ring-[#F5A000]' : 'border-amz-border'
              }`}
            >
              <span className="flex items-start justify-between gap-2 text-sm text-slate-600">
                {card.label}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF4CC] text-[#B77900]">
                  <Icon name={card.icon} className="h-4 w-4" />
                </span>
              </span>
              <span className="mt-3 block text-2xl font-bold text-amz-navy" aria-live="polite">
                {term ? displayCount : state.isLoading ? '…' : state.isError ? '—' : displayCount}
              </span>
              <span className="sr-only">{selected ? 'Selected filter' : 'Click to filter tickets'}</span>
            </button>
          )
        })}
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-amz-border bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 p-4 sm:p-5">
          <div>
            <h2 className="text-xl font-bold">Tickets</h2>
            <p className="text-sm text-slate-600">Tickets matching your search and status filter</p>
          </div>
          <p aria-live="polite" className="text-sm text-slate-600">Showing {filtered.length} {term || activeStatus ? 'matching' : 'recent'} tickets</p>
        </div>

        {isLoading ? (
          <p className="px-5 pb-5 text-sm text-slate-600" role="status">Loading tickets…</p>
        ) : isError ? (
          <div className="px-5 pb-5">
            <p role="alert" className="text-sm text-red-700">
              {error instanceof Error ? error.message : 'Could not load tickets.'}
            </p>
            <button type="button" onClick={onRetry} className="mt-2 min-h-11 text-sm font-medium text-amz-link underline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 pb-6 text-center">
            <p className="text-sm text-slate-600">No tickets match your search or filter.</p>
            <button type="button" onClick={resetFilters} className="mt-2 min-h-11 px-3 text-sm font-medium text-amz-link underline">Reset filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-y border-amz-border bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                  <th scope="col" className="px-4 py-3 font-semibold">Ticket ID</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Subject</th>
                  {role !== 'customer' && <th scope="col" className="px-4 py-3 font-semibold">Customer</th>}
                  {role === 'admin' && <th scope="col" className="px-4 py-3 font-semibold">Assigned Agent</th>}
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Priority</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open ticket ${ticket.title || ticket.subject || ticket.id}`}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/tickets/${ticket.id}`)
                      }
                    }}
                    className="cursor-pointer border-b border-amz-border last:border-0 hover:bg-amber-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F5A000]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-700">#{ticket.id.slice(0, 8)}</td>
                    <td className="max-w-[260px] truncate px-4 py-3 font-medium text-amz-link">{ticket.title || ticket.subject || 'Untitled ticket'}</td>
                    {role !== 'customer' && <td className="max-w-[180px] truncate px-4 py-3">{customerLabel(ticket)}</td>}
                    {role === 'admin' && <td className="max-w-[180px] truncate px-4 py-3">{ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}</td>}
                    <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={ticket.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${priorityStyle(ticket.priority)}`}>{ticket.priority || '—'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {ticket.updatedAt || ticket.createdAt
                        ? new Date(ticket.updatedAt || ticket.createdAt!).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
