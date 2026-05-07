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
  provider: 'github-models' | 'openai' | 'anthropic'
  model: string
  agentName: string
}

export async function callAgent(params: AgentCallParams): Promise<AgentCallResult | null> {
  const token = process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_API_BASE || 'https://models.inference.ai.azure.com'
  
  if (!token) {
    console.warn('[agent-runtime] No API token (GITHUB_TOKEN or OPENAI_API_KEY) found. AI features are disabled.')
    return null
  }

  const agentPath = join(__dirname, 'agents', params.agentFile)
  let systemContent = ''
  try {
    systemContent = readFileSync(agentPath, 'utf-8')
  } catch (err) {
    console.error(`[agent-runtime] Could not read agent file: ${params.agentFile}`, (err as Error).message)
    return null
  }

  const model = 'gpt-4o-mini' // Standard free model on GitHub Models
  
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: params.userContent }
        ],
        temperature: 0.1,
        max_tokens: params.maxTokens ?? 2048
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const raw = data.choices[0]?.message.content ?? ''

    return {
      raw,
      provider: 'github-models',
      model,
      agentName: params.agentFile
    }
  } catch (err) {
    console.error(`[agent-runtime] AI call failed for ${params.agentFile}:`, (err as Error).message)
    return null
  }
}

export function parseAgentJSON<T>(result: AgentCallResult): T | null {
  try {
    const cleaned = result.raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    return JSON.parse(cleaned) as T
  } catch (err) {
    console.warn(`[agent-runtime] Failed to parse JSON from ${result.agentName}:`, (err as Error).message)
    return null
  }
}
