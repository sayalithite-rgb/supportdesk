import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

type Props = {
  label: string
  hint: string
  icon: IconName
  to: string
  value?: number
  isLoading: boolean
  isError: boolean
}

export default function StatCard({ label, hint, icon, to, value, isLoading, isError }: Props) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-amz-border bg-white p-5 shadow-sm transition hover:border-amz-orange hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amz-orange"
    >
      <div className="flex items-start justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fef3c7] text-[#b45309]">
          <Icon name={icon} />
        </span>
      </div>

      <div className="mt-5 text-3xl font-bold text-amz-navy" aria-live="polite">
        {isLoading ? (
          <span className="inline-block h-8 w-12 rounded bg-slate-200 animate-pulse" aria-label="Loading" />
        ) : isError ? (
          <span className="text-slate-400" title="Could not load this number">—</span>
        ) : (
          value
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </Link>
  )
}