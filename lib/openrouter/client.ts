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
  model: string = 'mistralai/mistral-large',
  stream: boolean = true
): Promise<ReadableStream<Uint8Array> | OpenRouterResponse> {
  // Use a model that allows NSFW content
  // Recommended models for NSFW: mistralai/mistral-large, mistralai/mixtral-8x7b-instruct
  // Avoid: meta-llama models (they have strict content filters)
  
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
      temperature: 0.85, // Slightly higher for more creative, varied responses
      max_tokens: 4000, // Increased for longer, more detailed responses
      top_p: 0.9, // Nucleus sampling for better quality
      frequency_penalty: 0.3, // Reduce repetition of words/phrases
      presence_penalty: 0.2, // Encourage exploring new topics
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

