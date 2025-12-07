'use client'

import { useState } from 'react'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'

interface VoicePlayerProps {
  text: string
  voiceId?: string
}

export function VoicePlayer({ text, voiceId }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const handlePlay = async () => {
    if (isPlaying) {
      // Stop playback
      setIsPlaying(false)
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voiceId }),
      })

      if (!response.ok) {
        // Fallback to browser TTS
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.onend = () => setIsPlaying(false)
          speechSynthesis.speak(utterance)
          setIsPlaying(true)
          setIsLoading(false)
          return
        }
        throw new Error('TTS failed')
      }

      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)

      const audio = new Audio(url)
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
        setAudioUrl(null)
      }
      audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('TTS error:', error)
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.onend = () => setIsPlaying(false)
        speechSynthesis.speak(utterance)
        setIsPlaying(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handlePlay}
      className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
      title={isPlaying ? 'Stop playback' : 'Play audio'}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#888]" />
      ) : isPlaying ? (
        <VolumeX className="w-4 h-4 text-[#ededed]" />
      ) : (
        <Volume2 className="w-4 h-4 text-[#888]" />
      )}
    </button>
  )
}

