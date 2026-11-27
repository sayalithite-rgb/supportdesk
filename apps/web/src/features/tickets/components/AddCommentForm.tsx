import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCommentSchema, type CreateCommentInput } from '../schemas'
import { useAddComment } from '../hooks/useTicketQueries'

export default function AddCommentForm({
  ticketId,
  allowInternalNotes = false,
}: {
  ticketId: string
  allowInternalNotes?: boolean
}) {
  const mutation = useAddComment(ticketId)
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCommentInput>({ resolver: zodResolver(createCommentSchema) })

  function onSubmit(values: CreateCommentInput) {
    mutation.mutate(
      { ...values, isInternal: allowInternalNotes && visibility === 'internal' },
      { onSuccess: () => reset() },
    )
  }

  // ⚠️ Field ka naam ('body') comments.validation.ts se match karo
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      {allowInternalNotes && (
        <div className="flex border-b border-amz-border" role="tablist" aria-label="Comment type">
          <button
            type="button"
            role="tab"
            aria-selected={visibility === 'public'}
            onClick={() => setVisibility('public')}
            className={`min-h-11 border-b-2 px-3 text-sm font-medium ${
              visibility === 'public' ? 'border-amz-orange text-amz-navy' : 'border-transparent text-slate-500'
            }`}
          >
            Public Reply
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={visibility === 'internal'}
            onClick={() => setVisibility('internal')}
            className={`min-h-11 border-b-2 px-3 text-sm font-medium ${
              visibility === 'internal' ? 'border-amz-orange text-amz-navy' : 'border-transparent text-slate-500'
            }`}
          >
            Internal Note
          </button>
        </div>
      )}
      <label htmlFor="comment" className="block text-sm font-medium">
        {visibility === 'internal' ? 'Add an internal note' : 'Write a public reply'}
      </label>
      <textarea
        id="comment"
        rows={4}
        placeholder={visibility === 'internal' ? 'Only your support team can see this note.' : 'Write a reply to the customer…'}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-amz-orange focus:outline-none focus:ring-2 focus:ring-amz-orange/20"
        {...register('content')}
      />
      {errors.content && <p className="text-xs text-[#c40000]">{errors.content.message}</p>}
      {mutation.isError && (
        <p role="alert" className="text-sm text-[#c40000]">{mutation.error.message}</p>
      )}
      <button
        type="submit"
        disabled={mutation.isPending}
        className={`min-h-11 rounded-lg border px-5 text-sm font-semibold disabled:opacity-60 ${
          visibility === 'internal'
            ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
            : 'border-[#fcd200] bg-amz-yellow hover:bg-amz-yellow-dark'
        }`}
      >
        {mutation.isPending ? 'Posting…' : visibility === 'internal' ? 'Add internal note' : 'Send reply'}
      </button>
    </form>
  )
}