export type ConversationMode = 'quick' | 'deep' | 'roleplay' | 'advice' | 'dominant'

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  reactions: Record<string, boolean> | null
  created_at: string
  metadata: {
    typing_speed?: number
    pauses?: number[]
    [key: string]: any
  } | null
}

export interface Conversation {
  id: string
  user_id: string
  persona_id: string
  mode: ConversationMode
  theme: string | null
  created_at: string
  updated_at: string
  is_archived: boolean
  tags: string[] | null
}

