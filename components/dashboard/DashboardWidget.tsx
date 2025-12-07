'use client'

import { ReactNode } from 'react'
import { X, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardWidgetProps {
  id: string
  title: string
  children: ReactNode
  onRemove?: (id: string) => void
  className?: string
}

export function DashboardWidget({ id, title, children, onRemove, className }: DashboardWidgetProps) {
  return (
    <div className={cn('bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-[#666] cursor-move" />
          <h3 className="text-sm font-semibold text-[#ededed]">{title}</h3>
        </div>
        {onRemove && (
          <button
            onClick={() => onRemove(id)}
            className="p-1 rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-4 h-4 text-[#888]" />
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

