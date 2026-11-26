type Props = { page: number; totalPages: number; onChange: (page: number) => void }

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  const btn =
    'px-3 py-1.5 text-sm border border-amz-border rounded bg-white hover:bg-slate-50 disabled:opacity-50'
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between mt-4">
      <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>
      <button className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  )
}