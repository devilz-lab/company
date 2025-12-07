export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          created_at: string
          preferences: Record<string, any> | null
          relationship_level: number
          total_conversations: number
          streak_days: number
          last_active: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          created_at?: string
          preferences?: Record<string, any> | null
          relationship_level?: number
          total_conversations?: number
          streak_days?: number
          last_active?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          created_at?: string
          preferences?: Record<string, any> | null
          relationship_level?: number
          total_conversations?: number
          streak_days?: number
          last_active?: string | null
        }
      }
      personas: {
        Row: {
          id: string
          user_id: string
          name: string
          personality_traits: Record<string, any>
          communication_style: string
          avatar_url: string | null
          voice_id: string | null
          color_scheme: Record<string, any> | null
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          personality_traits: Record<string, any>
          communication_style: string
          avatar_url?: string | null
          voice_id?: string | null
          color_scheme?: Record<string, any> | null
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          personality_traits?: Record<string, any>
          communication_style?: string
          avatar_url?: string | null
          voice_id?: string | null
          color_scheme?: Record<string, any> | null
          created_at?: string
          is_active?: boolean
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          persona_id: string
          mode: string
          theme: string | null
          created_at: string
          updated_at: string
          is_archived: boolean
          tags: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          persona_id: string
          mode: string
          theme?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          tags?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          persona_id?: string
          mode?: string
          theme?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          tags?: string[] | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          reactions: Record<string, any> | null
          created_at: string
          metadata: Record<string, any> | null
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          reactions?: Record<string, any> | null
          created_at?: string
          metadata?: Record<string, any> | null
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          reactions?: Record<string, any> | null
          created_at?: string
          metadata?: Record<string, any> | null
        }
      }
      memories: {
        Row: {
          id: string
          user_id: string
          persona_id: string | null
          memory_type: string
          content: string
          importance: number
          strength: number
          context: Record<string, any> | null
          created_at: string
          last_accessed: string | null
          access_count: number
        }
        Insert: {
          id?: string
          user_id: string
          persona_id?: string | null
          memory_type: string
          content: string
          importance?: number
          strength?: number
          context?: Record<string, any> | null
          created_at?: string
          last_accessed?: string | null
          access_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          persona_id?: string | null
          memory_type?: string
          content?: string
          importance?: number
          strength?: number
          context?: Record<string, any> | null
          created_at?: string
          last_accessed?: string | null
          access_count?: number
        }
      }
      kinks: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          status: string
          notes: string | null
          exploration_count: number
          first_explored: string | null
          last_explored: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          status: string
          notes?: string | null
          exploration_count?: number
          first_explored?: string | null
          last_explored?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          status?: string
          notes?: string | null
          exploration_count?: number
          first_explored?: string | null
          last_explored?: string | null
        }
      }
      milestones: {
        Row: {
          id: string
          user_id: string
          persona_id: string | null
          type: string
          title: string
          description: string | null
          date: string
          metadata: Record<string, any> | null
          importance: number
        }
        Insert: {
          id?: string
          user_id: string
          persona_id?: string | null
          type: string
          title: string
          description?: string | null
          date?: string
          metadata?: Record<string, any> | null
          importance?: number
        }
        Update: {
          id?: string
          user_id?: string
          persona_id?: string | null
          type?: string
          title?: string
          description?: string | null
          date?: string
          metadata?: Record<string, any> | null
          importance?: number
        }
      }
    }
  }
}

