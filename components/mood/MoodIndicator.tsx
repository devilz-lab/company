'use client'

import { useState, useEffect } from 'react'
import { Smile, Frown, Heart, Flame, Cloud, Sun } from 'lucide-react'
import { motion } from 'framer-motion'

interface Mood {
  emoji: string
  label: string
  color: string
  icon: any
}

const moods: Mood[] = [
  { emoji: '😊', label: 'Happy', color: 'bg-yellow-500/20 border-yellow-500/50', icon: Sun },
  { emoji: '😍', label: 'Excited', color: 'bg-pink-500/20 border-pink-500/50', icon: Heart },
  { emoji: '🔥', label: 'Horny', color: 'bg-red-500/20 border-red-500/50', icon: Flame },
  { emoji: '😌', label: 'Calm', color: 'bg-blue-500/20 border-blue-500/50', icon: Cloud },
  { emoji: '😢', label: 'Sad', color: 'bg-gray-500/20 border-gray-500/50', icon: Frown },
  { emoji: '😴', label: 'Tired', color: 'bg-purple-500/20 border-purple-500/50', icon: Cloud },
]

export function MoodIndicator() {
  const [currentMood, setCurrentMood] = useState<Mood | null>(null)
  const [moodHistory, setMoodHistory] = useState<Array<{ mood: Mood; date: string }>>([])

  useEffect(() => {
    // Load recent mood from journal entries
    loadRecentMood()
  }, [])

  const loadRecentMood = async () => {
    try {
      const response = await fetch('/api/journal')
      if (response.ok) {
        const data = await response.json()
        const recentEntry = data.entries?.[0]
        if (recentEntry?.mood) {
          const mood = moods.find(m => recentEntry.mood.includes(m.emoji))
          if (mood) {
            setCurrentMood(mood)
          }
        }
      }
    } catch (error) {
      console.error('Error loading mood:', error)
    }
  }

  const handleMoodSelect = (mood: Mood) => {
    setCurrentMood(mood)
    // Save to journal or preferences
    // For now, just update local state
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[#ededed] mb-3">Current Mood</h3>
      
      {currentMood ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-3 p-3 rounded-lg border ${currentMood.color}`}
        >
          <span className="text-3xl">{currentMood.emoji}</span>
          <div>
            <p className="text-sm font-medium text-[#ededed]">{currentMood.label}</p>
            <p className="text-xs text-[#666]">Your current state</p>
          </div>
        </motion.div>
      ) : (
        <p className="text-sm text-[#888] mb-3">No mood set</p>
      )}

      <div className="mt-4">
        <p className="text-xs text-[#666] mb-2">Set your mood:</p>
        <div className="grid grid-cols-3 gap-2">
          {moods.map((mood) => (
            <button
              key={mood.label}
              onClick={() => handleMoodSelect(mood)}
              className={`p-3 rounded-lg border transition-colors ${
                currentMood?.label === mood.label
                  ? mood.color
                  : 'bg-[#0f0f0f] border-[#2a2a2a] hover:border-[#3a3a3a]'
              }`}
            >
              <span className="text-2xl block mb-1">{mood.emoji}</span>
              <span className="text-xs text-[#888]">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

