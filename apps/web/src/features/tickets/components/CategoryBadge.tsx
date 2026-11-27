const PALETTE = [
  'bg-indigo-100 text-indigo-800',
  'bg-cyan-100 text-cyan-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-slate-200 text-slate-700',
]

function hash(s: string) {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

function label(s: string) {
  const t = s.replace(/[_-]+/g, ' ').trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export default function CategoryBadge({ category }: { category?: string | null }) {
  if (!category) return <span className="text-xs text-slate-400">—</span>
  const style = PALETTE[hash(category.toLowerCase()) % PALETTE.length]
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${style}`}>
      {label(category)}
    </span>
  )
}