/**
 * Agent Runtime currently runs in local deterministic mode only.
 * External provider API calls are intentionally disabled.
 */

export interface AgentCallParams {
  agentFile: string
  userContent: string
  maxTokens?: number
}

export interface AgentCallResult {
  raw: string
  provider: 'openai' | 'anthropic'
  model: string
  agentName: string
}

let warnedExternalAIKeysIgnored = false

export async function callAgent(params: AgentCallParams): Promise<AgentCallResult | null> {
  void params
  const hasConfiguredExternalAI = Boolean(process.env.ANTHROPIC_API_KEY) || Boolean(process.env.OPENAI_API_KEY)
  if (hasConfiguredExternalAI && !warnedExternalAIKeysIgnored) {
    warnedExternalAIKeysIgnored = true
    console.warn('[agent-runtime] External AI providers are disabled; configured API keys are ignored.')
  }
  return null
}

export function parseAgentJSON<T>(result: AgentCallResult): T | null {
  try {
    const cleaned = result.raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    return JSON.parse(cleaned) as T
  } catch (err) {
    console.warn(`[agent-runtime] Failed to parse JSON from ${result.agentName}:`, (err as Error).message)
    console.warn('[agent-runtime] Raw response (first 200 chars):', result.raw.slice(0, 200))
    return null
  }
}
