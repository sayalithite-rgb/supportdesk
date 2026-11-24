const mockCreate = jest.fn()
const mockGetOpenAI = jest.fn(() => ({
  client: { chat: { completions: { create: mockCreate } } },
  model: 'test-model',
}))

jest.mock('./openaiClient', () => ({ getOpenAI: mockGetOpenAI }))
jest.mock('./usage', () => ({ recordAiCall: jest.fn() }))

import { recordAiCall } from './usage'
import { categorizeTicket, streamSuggestedReply } from './aiService'
import { AiInputError, AiInvalidOutputError, AiNotConfiguredError, AiProviderError } from './errors'

const meta = { ticketId: 't1', userId: 'u1' }
const ctx = {
  ticket: { title: 'Printer offline', description: 'Cannot print', status: 'open', priority: 'P2', category: 'technical' },
  comments: [{ authorRole: 'customer', body: 'Still broken' }],
}

const delta = (text: string) => ({ choices: [{ delta: { content: text } }] })
const usageChunk = { choices: [], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 } }

function streamOf(chunks: unknown[], thenThrow = false) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const c of chunks) yield c
      if (thenThrow) throw new Error('connection reset')
    },
  }
}

async function collect(gen: AsyncGenerator<string>) {
  let out = ''
  for await (const t of gen) out += t
  return out
}

const completion = (content: string | null) => ({
  choices: [{ message: { content } }],
  usage: { prompt_tokens: 50, completion_tokens: 10, total_tokens: 60 },
})

beforeEach(() => {
  mockCreate.mockReset()
  mockGetOpenAI.mockImplementation(() => ({
    client: { chat: { completions: { create: mockCreate } } },
    model: 'test-model',
  }))
  jest.mocked(recordAiCall).mockClear()
})

describe('streamSuggestedReply', () => {
  it('streams the draft and records usage', async () => {
    mockCreate.mockResolvedValue(streamOf([delta('Hello '), delta('there'), usageChunk]))
    expect(await collect(streamSuggestedReply(ctx, meta))).toBe('Hello there')

    const args = mockCreate.mock.calls[0][0]
    expect(args.stream).toBe(true)
    expect(args.max_tokens).toBe(600)
    expect(args.stream_options).toBeUndefined()
    expect(args.messages[0].role).toBe('system') // trusted instruction alag
    expect(args.messages[1].content).toContain('Printer offline') // ticket data alag
    expect(recordAiCall).toHaveBeenCalledWith(
      expect.objectContaining({ feature: 'suggest-reply', status: 'ok', usage: usageChunk.usage, ticketId: 't1' }),
    )
  })

  it('rejects an empty ticket without calling the provider', async () => {
    const empty = { ticket: { ...ctx.ticket, title: ' ', description: '' }, comments: [] }
    await expect(collect(streamSuggestedReply(empty, meta))).rejects.toBeInstanceOf(AiInputError)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('maps provider failure to AiProviderError and logs it', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockCreate.mockRejectedValue(Object.assign(new Error('private provider response'), {
      status: 401,
      code: 'invalid_api_key',
      requestID: 'req_123',
    }))
    try {
      await expect(collect(streamSuggestedReply(ctx, meta))).rejects.toMatchObject({
        status: 401,
      })
      expect(log).toHaveBeenCalledWith(JSON.stringify({
        event: 'ai_provider_error',
        status: 401,
        providerCode: 'invalid_api_key',
        requestId: 'req_123',
        errorType: 'Error',
      }))
      expect(log.mock.calls.flat().join(' ')).not.toContain('private provider response')
      expect(recordAiCall).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
    } finally {
      log.mockRestore()
    }
  })

  it('surfaces a stream interruption after partial output', async () => {
    mockCreate.mockResolvedValue(streamOf([delta('Partial')], true))
    const gen = streamSuggestedReply(ctx, meta)
    expect((await gen.next()).value).toBe('Partial')
    await expect(gen.next()).rejects.toBeInstanceOf(AiProviderError)
  })

  it('treats an empty model answer as an error', async () => {
    mockCreate.mockResolvedValue(streamOf([usageChunk]))
    await expect(collect(streamSuggestedReply(ctx, meta))).rejects.toBeInstanceOf(AiProviderError)
  })

  it('fails clearly when AI is not configured', async () => {
    mockGetOpenAI.mockImplementationOnce(() => {
      throw new AiNotConfiguredError()
    })
    await expect(collect(streamSuggestedReply(ctx, meta))).rejects.toBeInstanceOf(AiNotConfiguredError)
  })
})

describe('categorizeTicket', () => {
  const input = { title: 'Cannot login', description: 'Password reset email never arrives' }

  it('returns validated output and records usage', async () => {
    mockCreate.mockResolvedValue(
      completion(JSON.stringify({ category: 'account', priority: 'P2', reason: 'Login problem' })),
    )
    await expect(categorizeTicket(input, meta)).resolves.toEqual({
      category: 'account',
      priority: 'P2',
      reason: 'Login problem',
    })
    expect(mockCreate.mock.calls[0][0].max_tokens).toBe(300)
    expect(recordAiCall).toHaveBeenCalledWith(
      expect.objectContaining({ feature: 'categorize', status: 'ok', usage: completion('').usage }),
    )
  })

  it.each<[string]>([
    ['not json at all'],
    [''],
    ['{"category":"account"}'], // priority missing
    ['{"priority":"P2"}'], // category missing
    ['{"category":"billing","priority":"P2"}'], // unsupported category
    ['{"category":"account","priority":"P9"}'], // out-of-range priority
  ])('rejects invalid model output: %s', async (content: string) => {
    mockCreate.mockResolvedValue(completion(content))
    await expect(categorizeTicket(input, meta)).rejects.toBeInstanceOf(AiInvalidOutputError)
    expect(recordAiCall).toHaveBeenCalledWith(expect.objectContaining({ status: 'invalid_output' }))
  })

  it('rejects null content', async () => {
    mockCreate.mockResolvedValue(completion(null))
    await expect(categorizeTicket(input, meta)).rejects.toBeInstanceOf(AiInvalidOutputError)
  })

  it('maps provider errors', async () => {
    mockCreate.mockRejectedValue(new Error('timeout'))
    await expect(categorizeTicket(input, meta)).rejects.toBeInstanceOf(AiProviderError)
  })
})