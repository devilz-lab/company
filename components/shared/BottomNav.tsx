'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, Users, Heart, BarChart3, Settings, Sparkles, Trophy, BookOpen, Theater, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/conversations', icon: MessageCircle, label: 'History' },
  { href: '/personas', icon: Users, label: 'Personas' },
  { href: '/timeline', icon: Heart, label: 'Timeline' },
  { href: '/kinks', icon: Sparkles, label: 'Kinks' },
  { href: '/scenarios', icon: Theater, label: 'Scenarios' },
  { href: '/journal', icon: BookOpen, label: 'Journal' },
  { href: '/memories', icon: Brain, label: 'Memories' },
  { href: '/stats', icon: BarChart3, label: 'Stats' },
  { href: '/achievements', icon: Trophy, label: 'Achievements' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-[#2a2a2a] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[60px] px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-[#ededed] bg-[#2a2a2a]'
                  : 'text-[#888] hover:text-[#ededed]'
              )}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

