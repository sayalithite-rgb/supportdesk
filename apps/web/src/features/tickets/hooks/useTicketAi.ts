import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '../../../lib/api-client'
import * as aiApi from '../api/ai.api'

type ReplyStatus = 'idle' | 'streaming' | 'done' | 'error'

export function useSuggestReply(ticketId: string) {
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<ReplyStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    let finished = false

    setDraft('')
    setError(null)
    setStatus('streaming')

    try {
      await aiApi.streamSuggestedReply(
        ticketId,
        (event) => {
          if (event.type === 'delta') {
            setDraft((d) => d + event.text)
          } else if (event.type === 'done') {
            finished = true
            setStatus('done')
          } else {
            finished = true
            setError(event.message)
            setStatus('error')
          }
        },
        controller.signal,
      )
      if (!finished) {
        // connection beech mein toot gaya
        setError('The connection was interrupted. Please try again.')
        setStatus('error')
      }
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof ApiError ? err.message : 'Could not generate a reply.')
      setStatus('error')
    }
  }, [ticketId])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setStatus((s) => (s === 'streaming' ? 'idle' : s))
  }, [])

  // Page chhodte hi stream band, taaki OpenAI ka kharch na ho
  useEffect(() => () => abortRef.current?.abort(), [])

  return { draft, setDraft, status, error, start, stop }
}

export function useCategorizeTicket(ticketId: string) {
  return useMutation({ mutationFn: () => aiApi.categorizeTicket(ticketId) })
}