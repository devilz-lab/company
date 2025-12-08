'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LanguageSelector } from '@/components/i18n/LanguageSelector'
import { Language } from '@/lib/i18n/translator'
import { Upload } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<Language>('en')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [proactiveMessagesEnabled, setProactiveMessagesEnabled] = useState(true)
  
  // Memory extraction settings
  const [autoExtractMemories, setAutoExtractMemories] = useState(true)
  const [extractNicknames, setExtractNicknames] = useState(true)
  const [extractPreferences, setExtractPreferences] = useState(true)
  const [extractBoundaries, setExtractBoundaries] = useState(true)
  const [extractFacts, setExtractFacts] = useState(true)
  const [extractJokes, setExtractJokes] = useState(false)
  
  // Notification preferences
  const [notificationFrequency, setNotificationFrequency] = useState<'immediate' | 'hourly' | 'daily'>('immediate')
  const [notificationTypes, setNotificationTypes] = useState({
    proactive: true,
    achievements: true,
    milestones: true,
  })
  
  // Privacy controls
  const [dataSharing, setDataSharing] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [deleteAfterDays, setDeleteAfterDays] = useState<number | null>(null)

  useEffect(() => {
    // Load saved preferences
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }

    const savedNotifications = localStorage.getItem('notificationsEnabled')
    if (savedNotifications !== null) {
      setNotificationsEnabled(savedNotifications === 'true')
    }

    const savedProactive = localStorage.getItem('proactiveMessagesEnabled')
    if (savedProactive !== null) {
      setProactiveMessagesEnabled(savedProactive === 'true')
    }
    
    // Load memory extraction settings
    const savedAutoExtract = localStorage.getItem('autoExtractMemories')
    if (savedAutoExtract !== null) {
      setAutoExtractMemories(savedAutoExtract === 'true')
    }
    
    const savedExtractNicknames = localStorage.getItem('extractNicknames')
    if (savedExtractNicknames !== null) {
      setExtractNicknames(savedExtractNicknames === 'true')
    }
    
    const savedExtractPreferences = localStorage.getItem('extractPreferences')
    if (savedExtractPreferences !== null) {
      setExtractPreferences(savedExtractPreferences === 'true')
    }
    
    const savedExtractBoundaries = localStorage.getItem('extractBoundaries')
    if (savedExtractBoundaries !== null) {
      setExtractBoundaries(savedExtractBoundaries === 'true')
    }
    
    const savedExtractFacts = localStorage.getItem('extractFacts')
    if (savedExtractFacts !== null) {
      setExtractFacts(savedExtractFacts === 'true')
    }
    
    const savedExtractJokes = localStorage.getItem('extractJokes')
    if (savedExtractJokes !== null) {
      setExtractJokes(savedExtractJokes === 'true')
    }
    
    // Load notification preferences
    const savedNotificationFrequency = localStorage.getItem('notificationFrequency')
    if (savedNotificationFrequency) {
      setNotificationFrequency(savedNotificationFrequency as 'immediate' | 'hourly' | 'daily')
    }
    
    const savedNotificationTypes = localStorage.getItem('notificationTypes')
    if (savedNotificationTypes) {
      try {
        setNotificationTypes(JSON.parse(savedNotificationTypes))
      } catch (e) {
        // Use defaults
      }
    }
    
    // Load privacy controls
    const savedDataSharing = localStorage.getItem('dataSharing')
    if (savedDataSharing !== null) {
      setDataSharing(savedDataSharing === 'true')
    }
    
    const savedAnalyticsEnabled = localStorage.getItem('analyticsEnabled')
    if (savedAnalyticsEnabled !== null) {
      setAnalyticsEnabled(savedAnalyticsEnabled === 'true')
    }
    
    const savedDeleteAfterDays = localStorage.getItem('deleteAfterDays')
    if (savedDeleteAfterDays !== null) {
      const days = parseInt(savedDeleteAfterDays)
      setDeleteAfterDays(isNaN(days) ? null : days)
    }
  }, [])

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabled(enabled)
    localStorage.setItem('notificationsEnabled', String(enabled))
  }

  const handleProactiveChange = (enabled: boolean) => {
    setProactiveMessagesEnabled(enabled)
    localStorage.setItem('proactiveMessagesEnabled', String(enabled))
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#ededed] mb-1">Settings</h1>
        <p className="text-sm text-[#888]">Customize your experience</p>
      </div>

      <div className="space-y-6">
        {/* Language */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-3">Language</h3>
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
        </div>

        {/* Notifications */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-3">Notifications</h3>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-[#ededed]">Enable notifications</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => handleNotificationsChange(e.target.checked)}
              className="w-5 h-5 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a] focus:ring-[#3a3a3a]"
            />
          </label>
        </div>

        {/* Proactive Messages */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-3">Proactive Messages</h3>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-[#ededed]">Allow companion to message you</span>
            <input
              type="checkbox"
              checked={proactiveMessagesEnabled}
              onChange={(e) => handleProactiveChange(e.target.checked)}
              className="w-5 h-5 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a] focus:ring-[#3a3a3a]"
            />
          </label>
        </div>

        {/* Import Conversation */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-3">Import Conversation</h3>
          <p className="text-sm text-[#888] mb-3">
            Import a conversation from Grok or another chat to extract nicknames, preferences, and relationship patterns.
          </p>
          <button
            onClick={() => router.push('/settings/import')}
            className="w-full bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Conversation
          </button>
        </div>

        {/* Memory Extraction Settings */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-3">Memory Extraction</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-[#ededed]">Auto-extract memories from conversations</span>
              <input
                type="checkbox"
                checked={autoExtractMemories}
                onChange={(e) => {
                  setAutoExtractMemories(e.target.checked)
                  localStorage.setItem('autoExtractMemories', String(e.target.checked))
                }}
                className="w-5 h-5 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a] focus:ring-[#3a3a3a]"
              />
            </label>
            {autoExtractMemories && (
              <div className="ml-4 space-y-2 text-sm">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[#888]">Extract nicknames</span>
                  <input
                    type="checkbox"
                    checked={extractNicknames}
                    onChange={(e) => {
                      setExtractNicknames(e.target.checked)
                      localStorage.setItem('extractNicknames', String(e.target.checked))
                    }}
                    className="w-4 h-4 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[#888]">Extract preferences</span>
                  <input
                    type="checkbox"
                    checked={extractPreferences}
                    onChange={(e) => {
                      setExtractPreferences(e.target.checked)
                      localStorage.setItem('extractPreferences', String(e.target.checked))
                    }}
                    className="w-4 h-4 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[#888]">Extract boundaries</span>
                  <input
                    type="checkbox"
                    checked={extractBoundaries}
                    onChange={(e) => {
                      setExtractBoundaries(e.target.checked)
                      localStorage.setItem('extractBoundaries', String(e.target.checked))
                    }}
                    className="w-4 h-4 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[#888]">Extract personal facts</span>
                  <input
                    type="checkbox"
                    checked={extractFacts}
                    onChange={(e) => {
                      setExtractFacts(e.target.checked)
                      localStorage.setItem('extractFacts', String(e.target.checked))
                    }}
                    className="w-4 h-4 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[#888]">Extract jokes/playful moments</span>
                  <input
                    type="checkbox"
                    checked={extractJokes}
                    onChange={(e) => {
                      setExtractJokes(e.target.checked)
                      localStorage.setItem('extractJokes', String(e.target.checked))
                    }}
                    className="w-4 h-4 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a]"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-3">Notification Preferences</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#ededed] mb-2">
                Notification Frequency
              </label>
              <select
                value={notificationFrequency}
                onChange={(e) => {
                  const freq = e.target.value as 'immediate' | 'hourly' | 'daily'
                  setNotificationFrequency(freq)
                  localStorage.setItem('notificationFrequency', freq)
                }}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#ededed] focus:outline-none focus:border-[#3a3a3a]"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly digest</option>
                <option value="daily">Daily digest</option>
              </select>
            </div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#ededed]">Proactive messages</span>
                <input
                  type="checkbox"
                  checked={notificationTypes.proactive}
                  onChange={(e) => {
                    const newTypes = { ...notificationTypes, proactive: e.target.checked }
                    setNotificationTypes(newTypes)
                    localStorage.setItem('notificationTypes', JSON.stringify(newTypes))
                  }}
                  className="w-4 h-4 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#ededed]">Achievements</span>
                <input
                  type="checkbox"
                  checked={notificationTypes.achievements}
                  onChange={(e) => {
                    const newTypes = { ...notificationTypes, achievements: e.target.checked }
                    setNotificationTypes(newTypes)
                    localStorage.setItem('notificationTypes', JSON.stringify(newTypes))
                  }}
                  className="w-4 h-4 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#ededed]">Milestones</span>
                <input
                  type="checkbox"
                  checked={notificationTypes.milestones}
                  onChange={(e) => {
                    const newTypes = { ...notificationTypes, milestones: e.target.checked }
                    setNotificationTypes(newTypes)
                    localStorage.setItem('notificationTypes', JSON.stringify(newTypes))
                  }}
                  className="w-4 h-4 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Controls */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-3">Privacy & Data</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm text-[#ededed]">Enable analytics</span>
                <p className="text-xs text-[#666] mt-1">Help improve the app with usage data</p>
              </div>
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => {
                  setAnalyticsEnabled(e.target.checked)
                  localStorage.setItem('analyticsEnabled', String(e.target.checked))
                }}
                className="w-5 h-5 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a] focus:ring-[#3a3a3a]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm text-[#ededed]">Allow data sharing</span>
                <p className="text-xs text-[#666] mt-1">Share anonymized data for research</p>
              </div>
              <input
                type="checkbox"
                checked={dataSharing}
                onChange={(e) => {
                  setDataSharing(e.target.checked)
                  localStorage.setItem('dataSharing', String(e.target.checked))
                }}
                className="w-5 h-5 rounded bg-[#2a2a2a] border-[#3a3a3a] text-[#3a3a3a] focus:ring-[#3a3a3a]"
              />
            </label>
            <div>
              <label className="block text-sm font-medium text-[#ededed] mb-2">
                Auto-delete conversations after (days)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Never"
                value={deleteAfterDays || ''}
                onChange={(e) => {
                  const days = e.target.value ? parseInt(e.target.value) : null
                  setDeleteAfterDays(days)
                  localStorage.setItem('deleteAfterDays', days ? String(days) : '')
                }}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
              />
              <p className="text-xs text-[#666] mt-1">Leave empty to never auto-delete</p>
            </div>
          </div>
        </div>

        {/* API Keys Info */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#ededed] mb-3">Features</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#888]">Text-to-Speech</span>
              <span className={process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? 'text-green-400' : 'text-[#666]'}>
                {process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888]">Image Generation</span>
              <span className={process.env.NEXT_PUBLIC_STABILITY_AI_API_KEY ? 'text-green-400' : 'text-[#666]'}>
                {process.env.NEXT_PUBLIC_STABILITY_AI_API_KEY ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-[#666] mt-2">
              Add API keys to .env.local to enable these features
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

