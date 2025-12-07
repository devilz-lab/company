export type MemoryType = 
  | 'fact' 
  | 'preference' 
  | 'boundary' 
  | 'milestone' 
  | 'joke' 
  | 'pattern'
  | 'emotional_state'
  | 'scenario'

export interface Memory {
  id: string
  user_id: string
  persona_id: string | null
  memory_type: MemoryType
  content: string
  importance: number // 1-10
  strength: number // 0-1, decays over time
  context: {
    conversation_id?: string
    date?: string
    related_memories?: string[]
    [key: string]: any
  } | null
  created_at: string
  last_accessed: string | null
  access_count: number
}

