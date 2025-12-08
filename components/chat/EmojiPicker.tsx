'use client'

import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'

const emojiCategories = {
  'Reactions': ['❤️', '🔥', '👍', '😊', '⭐', '😍', '🤔', '😢', '😂', '😮', '😡', '🙏'],
  'Common': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Emotions': ['😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
  'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Objects': ['💋', '💌', '💍', '💎', '🔮', '💐', '🌹', '🥀', '🌺', '🌻', '🌷', '🌼', '🌸', '💮', '🏵️', '🌾', '🌿', '🍀', '🍁', '🍂', '🍃'],
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  trigger?: React.ReactNode
}

export function EmojiPicker({ onEmojiSelect, trigger }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<keyof typeof emojiCategories>('Reactions')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-full text-[#666] hover:text-[#888] hover:bg-[#2a2a2a] transition-colors"
          title="Add emoji"
        >
          <Smile className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg z-50 w-64 max-h-80 flex flex-col">
          {/* Category Tabs */}
          <div className="flex border-b border-[#2a2a2a] overflow-x-auto">
            {Object.keys(emojiCategories).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category as keyof typeof emojiCategories)}
                className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'text-[#ededed] border-b-2 border-[#3a3a3a]'
                    : 'text-[#888] hover:text-[#ededed]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="p-2 overflow-y-auto flex-1">
            <div className="grid grid-cols-8 gap-1">
              {emojiCategories[activeCategory].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#2a2a2a] transition-colors text-lg"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

