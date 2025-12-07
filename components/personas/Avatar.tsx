'use client'

import { useState } from 'react'
import { User, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  personaId: string
  avatarUrl: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  editable?: boolean
  onUpdate?: (url: string) => void
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
}

export function Avatar({ personaId, avatarUrl, name, size = 'md', editable = false, onUpdate }: AvatarProps) {
  const [isHovering, setIsHovering] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUpdate) return

    // For now, we'll use a data URL (in production, upload to Supabase Storage)
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      onUpdate(result)
    }
    reader.readAsDataURL(file)
  }

  const getInitials = () => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getColorFromName = () => {
    // Generate consistent color from name
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = hash % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  return (
    <div
      className={cn('relative rounded-full overflow-hidden bg-[#2a2a2a] flex items-center justify-center', sizeClasses[size])}
      style={!avatarUrl ? { backgroundColor: getColorFromName() } : undefined}
      onMouseEnter={() => editable && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-[#ededed] font-semibold">{getInitials()}</span>
      )}

      {editable && (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id={`avatar-upload-${personaId}`}
          />
          <label
            htmlFor={`avatar-upload-${personaId}`}
            className={cn(
              'absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer transition-opacity',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Upload className="w-4 h-4 text-[#ededed]" />
          </label>
        </>
      )}
    </div>
  )
}

