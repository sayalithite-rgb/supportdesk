import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import type { z } from 'zod'
import { createTicketSchema, type CreateTicketInput } from '../features/tickets/schemas'
import { useCreateTicket } from '../features/tickets/hooks/useTicketQueries'
import {
  CATEGORY_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from '../features/tickets/types'

const inputClass =
  'w-full border border-[#888c8c] rounded px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[#e77600] focus:ring-2 focus:ring-[#e77600]/30'

type CreateTicketFormInput = z.input<typeof createTicketSchema>

export default function NewTicketPage() {
  const navigate = useNavigate()
  const mutation = useCreateTicket()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTicketFormInput, unknown, CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'general',
      priority: 'P3',
    },
  })

  function onSubmit(values: CreateTicketInput) {
    mutation.mutate(values, {
      // asli response ka id use karke detail page pe jao
      onSuccess: (ticket) => navigate(`/tickets/${ticket.id}`, { state: { created: true } }),
    })
  }

  // ⚠️ Fields (title, description, category, priority) createTicketSchema se match karo.
  // Agar priority optional/default wali hai to us field ko hata sakte ho.
  return (
    <section className="max-w-xl">
      <Link to="/" className="text-sm text-amz-link hover:underline">← Back to tickets</Link>
      <h1 className="text-2xl font-normal my-4">Create a ticket</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white border border-amz-border rounded-lg p-5 space-y-4">
        {mutation.isError && (
          <p role="alert" className="border border-[#c40000] rounded-lg p-3 text-sm text-[#c40000]">
            {mutation.error.message}
          </p>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
          <input id="title" className={inputClass} {...register('title')} />
          {errors.title && <p className="text-xs text-[#c40000] mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <textarea id="description" rows={5} className={inputClass} {...register('description')} />
          {errors.description && <p className="text-xs text-[#c40000] mt-1">{errors.description.message}</p>}
        </div>

        <div>
  <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
  <select id="category" className={inputClass} {...register('category')}>
    <option value="">Select category</option>
    {TICKET_CATEGORIES.map((c) => (
      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
    ))}
  </select>
  {errors.category && <p className="text-xs text-[#c40000] mt-1">{errors.category.message}</p>}
</div>


        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</label>
          <select id="priority" className={inputClass} {...register('priority')}>
            <option value="">Select priority</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.priority && <p className="text-xs text-[#c40000] mt-1">{errors.priority.message}</p>}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-amz-yellow hover:bg-amz-yellow-dark border border-[#fcd200] rounded-full px-6 py-2 text-sm disabled:opacity-60"
        >
          {mutation.isPending ? 'Creating...' : 'Create ticket'}
        </button>
      </form>
    </section>
  )
}