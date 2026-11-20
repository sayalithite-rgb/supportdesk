import { ApiError } from '../../../lib/api-client'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div role="status" className="bg-white border border-amz-border rounded-lg p-8 text-center text-sm text-slate-600">
      {label}
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="bg-white border border-amz-border rounded-lg p-8 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-slate-600 mt-1">{hint}</p>}
    </div>
  )
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return "You don't have access to this."
    if (error.status === 404) return 'This item was not found.'
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="bg-white border border-[#c40000] rounded-lg p-6 text-center">
      <p className="text-[#c40000] font-medium">There was a problem</p>
      <p className="text-sm mt-1">{messageFor(error)}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm text-amz-link hover:underline">
          Try again
        </button>
      )}
    </div>
  )
}