import OpenAI from 'openai'
import { env } from '../config/env'
import { AiNotConfiguredError } from './errors'

let client: OpenAI | null = null

export function getOpenAI(): { client: OpenAI; model: string } {
  const apiKey = env.OPENAI_API_KEY?.trim()
  const model = env.OPENAI_MODEL?.trim()
  if (!apiKey || !model) throw new AiNotConfiguredError()

  if (!client) {
    client = new OpenAI({ apiKey, timeout: env.OPENAI_TIMEOUT_MS, maxRetries: 1 })
  }
  return { client, model }
}