import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCommentSchema, type CreateCommentInput } from '../schemas'
import { useAddComment } from '../hooks/useTicketQueries'

export default function AddCommentForm({ ticketId }: { ticketId: string }) {
  const mutation = useAddComment(ticketId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCommentInput>({ resolver: zodResolver(createCommentSchema) })

  function onSubmit(values: CreateCommentInput) {
    mutation.mutate(values, { onSuccess: () => reset() })
  }

  // ⚠️ Field ka naam ('body') comments.validation.ts se match karo
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
      <label htmlFor="comment" className="block text-sm font-medium">Add a comment</label>
      <textarea
        id="comment"
        rows={3}
        className="w-full border border-[#888c8c] rounded px-2.5 py-2 text-sm focus:outline-none focus:border-[#e77600] focus:ring-2 focus:ring-[#e77600]/30"
        {...register('content')}
      />
      {errors.content && <p className="text-xs text-[#c40000]">{errors.content.message}</p>}
      {mutation.isError && (
        <p role="alert" className="text-sm text-[#c40000]">{mutation.error.message}</p>
      )}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-amz-yellow hover:bg-amz-yellow-dark border border-[#fcd200] rounded-full px-5 py-1.5 text-sm disabled:opacity-60"
      >
        {mutation.isPending ? 'Posting...' : 'Post comment'}
      </button>
    </form>
  )
}