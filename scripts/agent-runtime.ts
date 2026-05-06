/**
 * Agent Runtime - loads agent identity files (agency-agents format: YAML frontmatter + markdown)
 * and invokes LLM APIs. Supports Anthropic (preferred) or OpenAI. Returns null when no key is set.
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

function parseAgentMarkdown(filePath: string): { name: string; systemPrompt: string } {
  const raw = readFileSync(filePath, 'utf-8')
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
    const body = frontmatterMatch[2].trim()
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
    const name = nameMatch ? nameMatch[1].trim() : 'Agent'
    return { name, systemPrompt: body }
  }
  return { name: 'Agent', systemPrompt: raw.trim() }
}

async function callAnthropic(systemPrompt: string, userContent: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY!
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5'
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt, messages: [{ role: 'user', content: userContent }] }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`)
  const data = await response.json() as { content: Array<{ type: string; text: string }> }
  const textBlock = data.content.find(b => b.type === 'text')
  if (!textBlock) throw new Error('No text block in Anthropic response')
  return textBlock.text
}

async function callOpenAI(systemPrompt: string, userContent: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }], response_format: { type: 'json_object' } }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new Error(`OpenAI API error ${response.status}: ${await response.text()}`)
  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content ?? ''
}

export async function callAgent(params: AgentCallParams): Promise<AgentCallResult | null> {
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY)
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY)
  if (!hasAnthropic && !hasOpenAI) return null

  const agentPath = join(__dirname, 'agents', params.agentFile)
  const { name, systemPrompt } = parseAgentMarkdown(agentPath)
  const maxTokens = params.maxTokens ?? 2048
  const provider = hasAnthropic ? 'anthropic' : 'openai'
  const model = hasAnthropic ? (process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5') : (process.env.OPENAI_MODEL ?? 'gpt-4o-mini')
  const raw = hasAnthropic
    ? await callAnthropic(systemPrompt, params.userContent, maxTokens)
    : await callOpenAI(systemPrompt, params.userContent, maxTokens)
  return { raw, provider, model, agentName: name }
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
