'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false
        recognitionInstance.lang = 'en-US'

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          onTranscript(transcript)
          setIsListening(false)
        }

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      }
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!recognition || disabled) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  if (!isSupported) {
    return null // Don't show button if not supported
  }

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors ${
        isListening
          ? 'bg-red-500/20 text-red-400'
          : 'text-[#888] hover:bg-[#2a2a2a] hover:text-[#ededed]'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  )
}

