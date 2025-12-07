export interface Persona {
  id: string
  user_id: string
  name: string
  personality_traits: {
    dominant?: boolean
    submissive?: boolean
    switch?: boolean
    assertive?: boolean
    caring?: boolean
    playful?: boolean
    [key: string]: any
  }
  communication_style: 'formal' | 'casual' | 'intimate' | 'playful' | 'dominant' | 'submissive'
  avatar_url: string | null
  voice_id: string | null
  color_scheme: {
    primary: string
    secondary: string
    accent: string
  } | null
  created_at: string
  is_active: boolean
}

export interface PersonaCreate {
  name: string
  personality_traits: Persona['personality_traits']
  communication_style: Persona['communication_style']
  color_scheme?: Persona['color_scheme']
  avatar_url?: string | null
}

