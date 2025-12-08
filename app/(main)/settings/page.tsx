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

