/**
 * Text-to-Speech integration
 * Supports multiple TTS providers
 */

export interface TTSOptions {
  text: string
  voice?: string
  speed?: number
  pitch?: number
}

export interface TTSProvider {
  name: string
  generateAudio: (options: TTSOptions) => Promise<Blob | string>
}

/**
 * ElevenLabs TTS (requires API key)
 */
export class ElevenLabsTTS implements TTSProvider {
  name = 'ElevenLabs'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateAudio(options: TTSOptions): Promise<Blob> {
    const voiceId = options.voice || '21m00Tcm4TlvDq8ikWAM' // Default voice

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text: options.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: options.speed || 1.0,
          pitch: options.pitch || 0,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS error: ${response.statusText}`)
    }

    return await response.blob()
  }
}

/**
 * Browser Web Speech API (free, no API key needed)
 */
export class WebSpeechTTS implements TTSProvider {
  name = 'Web Speech API'

  async generateAudio(options: TTSOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(options.text)
      utterance.rate = options.speed || 1.0
      utterance.pitch = options.pitch || 1.0
      utterance.voice = this.getVoice(options.voice)

      utterance.onend = () => resolve('completed')
      utterance.onerror = (e) => reject(e)

      speechSynthesis.speak(utterance)
    })
  }

  private getVoice(voiceName?: string): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices()
    if (voiceName) {
      return voices.find(v => v.name.includes(voiceName)) || null
    }
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null
  }
}

/**
 * Get available TTS provider
 */
export function getTTSProvider(): TTSProvider | null {
  // Try ElevenLabs first if API key is available
  if (process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
    return new ElevenLabsTTS(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY)
  }

  // Fallback to Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return new WebSpeechTTS()
  }

  return null
}

