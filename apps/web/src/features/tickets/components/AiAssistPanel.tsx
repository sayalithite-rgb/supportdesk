import { useState } from 'react'
import { useCategorizeTicket, useSuggestReply } from '../hooks/useTicketAi'
import CategoryBadge from './CategoryBadge'

const btn =
  'rounded-full border px-4 py-1.5 text-sm font-medium disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e77600]'

export default function AiAssistPanel({ ticketId }: { ticketId: string }) {
  const reply = useSuggestReply(ticketId)
  const categorize = useCategorizeTicket(ticketId)
  const [copied, setCopied] = useState(false)

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(reply.draft)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard allowed nahi: user text select karke copy kar sakta hai */
    }
  }

  const streaming = reply.status === 'streaming'

  return (
    <section aria-labelledby="ai-heading" className="space-y-5 rounded-lg border border-amz-border bg-white p-5">
      <div className="flex items-center gap-2">
        <h2 id="ai-heading" className="text-lg font-medium">AI assistant</h2>
        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-900">AI suggestions</span>
      </div>

      {/* Feature 1: Suggest reply */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reply.start}
            disabled={streaming}
            className={`${btn} border-[#fcd200] bg-amz-yellow hover:bg-amz-yellow-dark`}
          >
            {streaming ? 'Writing...' : 'Suggest reply'}
          </button>
          {streaming && (
            <button type="button" onClick={reply.stop} className={`${btn} border-amz-border bg-white`}>
              Stop
            </button>
          )}
        </div>

        {reply.error && (
          <p role="alert" className="text-sm text-[#c40000]">⚠ {reply.error}</p>
        )}

        {(reply.draft || streaming) && (
          <div>
            <label htmlFor="ai-draft" className="mb-1 block text-sm font-medium">
              Suggested reply (draft, not sent)
            </label>
            <textarea
              id="ai-draft"
              rows={7}
              readOnly={streaming}
              aria-busy={streaming}
              value={reply.draft}
              onChange={(e) => reply.setDraft(e.target.value)}
              className="w-full rounded border border-[#888c8c] bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600]/30"
            />
            <p className="mt-1 text-xs text-slate-600">
              This is an AI draft. Review and edit it, then paste it into a comment yourself. Nothing is sent automatically.
            </p>
            {!streaming && reply.draft && (
              <button type="button" onClick={copyDraft} className={`${btn} mt-2 border-amz-border bg-white`}>
                {copied ? 'Copied' : 'Copy draft'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Feature 2: Auto-categorise + priority */}
      <div className="space-y-2 border-t border-amz-border pt-4">
        <button
          type="button"
          onClick={() => categorize.mutate()}
          disabled={categorize.isPending}
          className={`${btn} border-amz-border bg-white hover:bg-slate-50`}
        >
          {categorize.isPending ? 'Analysing...' : 'Suggest category and priority'}
        </button>

        {categorize.isError && (
          <p role="alert" className="text-sm text-[#c40000]">⚠ {categorize.error.message}</p>
        )}

        {categorize.data && (
          <div className="rounded border border-indigo-200 bg-indigo-50 p-3 text-sm" aria-live="polite">
            <p className="mb-1 text-xs font-medium text-indigo-900">AI suggestion (please verify)</p>
            <p className="flex flex-wrap items-center gap-2">
              Category: <CategoryBadge category={categorize.data.category} />
              <span>Priority: <strong>{categorize.data.priority}</strong></span>
            </p>
            {categorize.data.reason && <p className="mt-1 text-slate-700">{categorize.data.reason}</p>}
          </div>
        )}
      </div>
    </section>
  )
}