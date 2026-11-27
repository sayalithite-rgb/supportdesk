import { describe, expect, it, jest } from '@jest/globals'

jest.mock('../config/env', () => ({ env: {} })) // env.ts ke baaki required keys ki zaroorat nahi

import { estimateCostUsd } from './usage'

describe('estimateCostUsd', () => {
  it('computes cost from provider usage and configured prices', () => {
    expect(estimateCostUsd({ prompt_tokens: 1_000_000, completion_tokens: 500_000 }, 2, 8)).toBe(6)
  })
  it('returns null when prices are not configured', () => {
    expect(estimateCostUsd({ prompt_tokens: 10, completion_tokens: 5 })).toBeNull()
  })
  it('returns null when the provider sent no usage (never invents numbers)', () => {
    expect(estimateCostUsd(undefined, 2, 8)).toBeNull()
  })
})