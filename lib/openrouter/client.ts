export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function chatWithOpenRouter(
  messages: OpenRouterMessage[],
  model: string = 'meta-llama/llama-3-70b-instruct',
  stream: boolean = true
): Promise<ReadableStream<Uint8Array> | OpenRouterResponse> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Companion App',
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      temperature: 0.8,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${error}`)
  }

  if (stream) {
    return response.body!
  } else {
    return await response.json()
  }
}

