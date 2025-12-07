import { NextRequest } from 'next/server'
import { StabilityAIGenerator } from '@/lib/images/generator'

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, negative_prompt } = await req.json()

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 })
    }

    // Check if Stability AI API key is available
    if (!process.env.STABILITY_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Image generation not configured. Add STABILITY_AI_API_KEY to enable.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const generator = new StabilityAIGenerator(process.env.STABILITY_AI_API_KEY)
    const imageBase64 = await generator.generateImage({
      prompt,
      style,
      negative_prompt,
    })

    return Response.json({ image: imageBase64 })
  } catch (error) {
    console.error('Image generation error:', error)
    return new Response(JSON.stringify({ error: 'Image generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

