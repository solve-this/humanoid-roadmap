import { describe, it, expect, beforeEach } from 'vitest'
import { parseAgentJSON } from '../../scripts/agent-runtime.js'
import type { AgentCallResult } from '../../scripts/agent-runtime.js'

function mockResult(raw: string): AgentCallResult {
  return { raw, provider: 'openai', model: 'gpt-4o-mini', agentName: 'Test' }
}

describe('parseAgentJSON', () => {
  it('parses a clean JSON array', () => {
    const result = parseAgentJSON<number[]>(mockResult('[1, 2, 3]'))
    expect(result).toEqual([1, 2, 3])
  })

  it('parses a clean JSON object', () => {
    const result = parseAgentJSON<{ value: number }>(mockResult('{"value":42}'))
    expect(result).toEqual({ value: 42 })
  })

  it('strips markdown ```json fences', () => {
    const result = parseAgentJSON<{ value: number }>(mockResult('```json\n{"value":42}\n```'))
    expect(result).toEqual({ value: 42 })
  })

  it('strips plain ``` fences', () => {
    const result = parseAgentJSON<number[]>(mockResult('```\n[1,2,3]\n```'))
    expect(result).toEqual([1, 2, 3])
  })

  it('returns null on malformed JSON', () => {
    const result = parseAgentJSON(mockResult('Not JSON at all.'))
    expect(result).toBeNull()
  })

  it('returns null on empty string', () => {
    const result = parseAgentJSON(mockResult(''))
    expect(result).toBeNull()
  })
})

describe('callAgent without API keys', () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
  })

  it('returns null when neither API key is set', async () => {
    const { callAgent } = await import('../../scripts/agent-runtime.js')
    const result = await callAgent({ agentFile: 'news-analyst.md', userContent: 'test' })
    expect(result).toBeNull()
  })
})
