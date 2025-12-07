'use client'

import { ConversationList } from '@/components/conversations/ConversationList'

export default function ConversationsPage() {
  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#ededed] mb-1">Conversations</h1>
        <p className="text-sm text-[#888]">All your conversations</p>
      </div>
      <ConversationList />
    </div>
  )
}

