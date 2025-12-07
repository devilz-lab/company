import { NextRequest } from 'next/server'
import { ElevenLabsTTS } from '@/lib/voice/tts'

export async function POST(req: NextRequest) {
  try {
    const { text, voice, speed, pitch } = await req.json()

    if (!text) {
      return new Response('Text is required', { status: 400 })
    }

    // Check if ElevenLabs API key is available
    if (!process.env.ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'TTS not configured. Add ELEVENLABS_API_KEY to enable.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const tts = new ElevenLabsTTS(process.env.ELEVENLABS_API_KEY)
    const audioBlob = await tts.generateAudio({ text, voice, speed, pitch })

    return new Response(audioBlob, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"',
      },
    })
  } catch (error) {
    console.error('TTS API error:', error)
    return new Response(JSON.stringify({ error: 'TTS generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

