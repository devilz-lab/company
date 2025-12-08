'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onInterimTranscript?: (text: string) => void
  disabled?: boolean
  large?: boolean
  autoSend?: boolean
}

export function VoiceInput({ 
  onTranscript, 
  onInterimTranscript,
  disabled, 
  large = false,
  autoSend = false 
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [interimTranscript, setInterimTranscript] = useState('')

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = 'en-US'

        recognitionInstance.onresult = (event: any) => {
          let interim = ''
          let final = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              final += transcript + ' '
            } else {
              interim += transcript
            }
          }

          if (interim) {
            setInterimTranscript(interim)
            onInterimTranscript?.(interim)
          }

          if (final) {
            const finalText = final.trim()
            if (finalText) {
              onTranscript(finalText)
              setInterimTranscript('')
              onInterimTranscript?.('')
              if (autoSend) {
                // Auto-send after a short delay to ensure input is set
                setTimeout(() => {
                  const form = document.querySelector('form')
                  if (form) {
                    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement
                    if (submitButton && !submitButton.disabled) {
                      submitButton.click()
                    }
                  }
                }, 300)
              }
            }
          }
        }

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          setInterimTranscript('')
          onInterimTranscript?.('')
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
          setInterimTranscript('')
          onInterimTranscript?.('')
        }

        setRecognition(recognitionInstance)
      }
    }
  }, [onTranscript, onInterimTranscript, autoSend])

  const toggleListening = () => {
    if (!recognition || disabled) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      setInterimTranscript('')
      onInterimTranscript?.('')
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  if (!isSupported) {
    return null // Don't show button if not supported
  }

  const buttonSize = large ? 'p-4' : 'p-2'
  const iconSize = large ? 'w-6 h-6' : 'w-5 h-5'

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`${buttonSize} rounded-xl transition-all ${
        isListening
          ? 'bg-red-500/30 text-red-400 shadow-lg shadow-red-500/20 animate-pulse'
          : 'text-[#888] hover:bg-[#2a2a2a] hover:text-[#ededed]'
      } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? (
        <MicOff className={iconSize} />
      ) : (
        <Mic className={iconSize} />
      )}
    </button>
  )
}

