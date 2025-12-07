'use client'

import { Globe } from 'lucide-react'
import { Language, SUPPORTED_LANGUAGES, translate } from '@/lib/i18n/translator'

interface LanguageSelectorProps {
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)

  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="appearance-none bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 pr-10 text-[#ededed] focus:outline-none focus:border-[#3a3a3a] cursor-pointer"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-[#1a1a1a]">
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888] pointer-events-none" />
    </div>
  )
}

