export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI is not configured')
    this.name = 'AiNotConfiguredError'
  }
}

export class AiInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiInputError'
  }
}

export class AiProviderError extends Error {
  constructor(message = 'AI provider request failed', public readonly status?: number) {
    super(message)
    this.name = 'AiProviderError'
  }
}

// diagnostic mein sirf "kaunsa field kyun galat" hota hai, model ka asli text nahi
export class AiInvalidOutputError extends Error {
  constructor(public readonly diagnostic: string) {
    super('AI returned invalid output')
    this.name = 'AiInvalidOutputError'
  }
}