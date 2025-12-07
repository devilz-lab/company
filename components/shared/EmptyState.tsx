'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-4 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] mb-4">
        <Icon className="w-12 h-12 text-[#888]" />
      </div>
      <h3 className="text-lg font-semibold text-[#ededed] mb-2">{title}</h3>
      <p className="text-sm text-[#888] mb-6 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-xl px-6 py-3 transition-colors font-medium"
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  )
}

