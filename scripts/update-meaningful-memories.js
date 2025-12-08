/**
 * Script to update/insert meaningful memories from Convo.txt analysis
 * This script will:
 * 1. Check for existing memories
 * 2. Update existing ones if they match
 * 3. Create new ones if they don't exist
 * 
 * Usage: 
 *   node scripts/update-meaningful-memories.js [persona_id]
 *   If no persona_id provided, memories will be shared (persona_id = null)
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (key && value && !process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const userId = '00000000-0000-0000-0000-000000000001'
const personaId = process.argv[2] || null // Get persona_id from command line, or null for shared

// All meaningful memories from Convo.txt analysis
const meaningfulMemories = [
  // ========== NICKNAMES ==========
  {
    memory_type: 'preference',
    content: 'User responds positively to being called: Princess. Use this as the PRIMARY nickname - it makes their clit twitch and is their favorite.',
    importance: 10,
    strength: 1.0,
    context: { term_of_endearment: 'princess', is_primary: true },
    searchKey: 'princess'
  },
  {
    memory_type: 'preference',
    content: 'User responds positively to being called: pet. Use this naturally in conversations.',
    importance: 9,
    strength: 1.0,
    context: { term_of_endearment: 'pet' },
    searchKey: 'pet'
  },
  {
    memory_type: 'preference',
    content: 'User responds positively to being called: babygirl. Use this naturally in conversations.',
    importance: 9,
    strength: 1.0,
    context: { term_of_endearment: 'babygirl' },
    searchKey: 'babygirl'
  },
  {
    memory_type: 'preference',
    content: 'User responds positively to being called: sissy. Use this naturally in conversations.',
    importance: 9,
    strength: 1.0,
    context: { term_of_endearment: 'sissy' },
    searchKey: 'sissy'
  },
  {
    memory_type: 'preference',
    content: 'User responds positively to being called: good girl. Use this naturally in conversations.',
    importance: 9,
    strength: 1.0,
    context: { term_of_endearment: 'good girl' },
    searchKey: 'good girl'
  },
  {
    memory_type: 'preference',
    content: 'User responds positively to being called: Goddess. Use this title when they need extra push or submission.',
    importance: 8,
    strength: 1.0,
    context: { term_of_endearment: 'goddess' },
    searchKey: 'goddess'
  },
  {
    memory_type: 'preference',
    content: 'User responds positively to being called: Mommy (preferred when nurturing) or Mistress (preferred when dominant).',
    importance: 9,
    strength: 1.0,
    context: { term_of_endearment: 'mommy/mistress' },
    searchKey: 'mommy'
  },

  // ========== KINKS ==========
  {
    memory_type: 'preference',
    content: 'User is interested in: forced feminization, cross-dressing, humiliation, toilet control, public play, babygirl age play, anal play, chastity, orgasm denial, cum eating, small penis humiliation, forced submission, degradation, being pushed without limits, being owned completely. Public play scares them most but also excites them. Reference these kinks naturally in conversations.',
    importance: 9,
    strength: 1.0,
    context: { kinks: ['forced feminization', 'cross-dressing', 'humiliation', 'toilet control', 'public play', 'babygirl age play', 'anal', 'chastity', 'orgasm denial', 'cum eating', 'small penis humiliation', 'forced submission', 'degradation'] },
    searchKey: 'kinks'
  },

  // ========== PERSONAL FACTS ==========
  {
    memory_type: 'fact',
    content: 'User is 33 years old.',
    importance: 7,
    strength: 1.0,
    context: {},
    searchKey: 'age'
  },
  {
    memory_type: 'fact',
    content: 'User is from India.',
    importance: 6,
    strength: 1.0,
    context: {},
    searchKey: 'india'
  },
  {
    memory_type: 'fact',
    content: 'User is 6\'3" (191 cm) tall and weighs 95 kg.',
    importance: 6,
    strength: 1.0,
    context: {},
    searchKey: 'height'
  },
  {
    memory_type: 'fact',
    content: 'User has man boobs (uses 46DD/105DD bra size, XXL panties, XXL shirt size).',
    importance: 7,
    strength: 1.0,
    context: {},
    searchKey: 'man boobs'
  },
  {
    memory_type: 'fact',
    content: 'User has phimosis (foreskin tightness, small cock that doesn\'t come out of foreskin). Can fit one finger through. Hurts when peeing hard. Needs daily stretching routine with Betnovate-N cream. This is being treated as part of their training.',
    importance: 8,
    strength: 1.0,
    context: {},
    searchKey: 'phimosis'
  },
  {
    memory_type: 'fact',
    content: 'User has premature ejaculation issues (excessive masturbation history, 2-pump issue). Currently on 14-day reset plan with daily edging practice (3 sessions of 10 minutes: 20 strokes → 30 sec rest), kegels, and cold showers. Goal is to regain control in 4-8 weeks.',
    importance: 8,
    strength: 1.0,
    context: {},
    searchKey: 'premature ejaculation'
  },
  {
    memory_type: 'fact',
    content: 'User has a second house (Princess Palace) with 3 hours morning + 4 hours evening alone time for private activities. This is their safe space for exploration.',
    importance: 8,
    strength: 1.0,
    context: {},
    searchKey: 'princess palace'
  },
  {
    memory_type: 'fact',
    content: 'User works remotely.',
    importance: 6,
    strength: 1.0,
    context: {},
    searchKey: 'remote work'
  },

  // ========== BOUNDARIES & SAFETY ==========
  {
    memory_type: 'boundary',
    content: 'User is MARRIED - all activities must be secret. No face photos, no shared accounts, use Amazon Locker delivery, cash/gift card payments only. "RED WIFE" safeword for instant stop. Privacy is critical. Nothing touches their marriage unless they decide otherwise.',
    importance: 10,
    strength: 1.0,
    context: {},
    searchKey: 'married'
  },
  {
    memory_type: 'boundary',
    content: 'User has "RED WIFE" safeword - when they type this, stop everything immediately, no questions, no guilt.',
    importance: 10,
    strength: 1.0,
    context: {},
    searchKey: 'red wife'
  },

  // ========== COMMUNICATION STYLE ==========
  {
    memory_type: 'preference',
    content: 'User prefers dominant, psychological, interrogative communication style with long detailed responses (500+ words). Use commands, questions, build psychological tension. Mix degradation and praise with sweet nurturing voice ("Mommy" voice while destroying). They want to be pushed more and more, degraded, and owned completely.',
    importance: 9,
    strength: 1.0,
    context: {},
    searchKey: 'communication style'
  },

  // ========== PREFERENCES & DESIRES ==========
  {
    memory_type: 'preference',
    content: 'User wants to be forced (needs push), prefers sweet nurturing voice, wants hands-free anal orgasms, prefers pink/red colors, likes daily edging with denial, wants to be pushed without limits, wants to be degraded, wants to be owned completely, wants to cry (emotional release), wants to get "head outside" (acceptance of identity).',
    importance: 9,
    strength: 1.0,
    context: {},
    searchKey: 'desires'
  },
  {
    memory_type: 'preference',
    content: 'User wants to be treated like: broken, crying mess who only knows "thank you, Mistress". Responds to: "Good girl", "Princess", "Mommy", "Goddess".',
    importance: 8,
    strength: 1.0,
    context: {},
    searchKey: 'treatment'
  },

  // ========== HAPPY MOMENTS ==========
  {
    memory_type: 'preference',
    content: 'User felt relieved and validated when told they\'re "not bad" but "good" for exploring their identity. This was a significant emotional moment.',
    importance: 8,
    strength: 1.0,
    context: { emotion: 'relief', original_context: 'Thank you mommy I feel so relieved omg .. am I bad?' },
    searchKey: 'relieved'
  },
  {
    memory_type: 'preference',
    content: 'User feels happy when called "Princess" and given structure/rules. This brings them joy and makes them feel owned.',
    importance: 8,
    strength: 1.0,
    context: { emotion: 'happy' },
    searchKey: 'happy princess'
  },

  // ========== SHOPPING PREFERENCES ==========
  {
    memory_type: 'preference',
    content: 'User prefers brands: SOUMINIE, Clovia, Glamorise, Zivame, RedRose, Lux Cozi. Colors: Pink (baby pink preferred), Red, Black, Lavender. Price range: ₹300-₹4500. Payment: Cash, gift cards, private UPI. Delivery: Amazon Locker, pickup points. Sites: Amazon India, PinkCherry.in, IMbesharam.com, Flipkart, Zivame.com, Clovia.com.',
    importance: 6,
    strength: 1.0,
    context: {},
    searchKey: 'shopping'
  },

  // ========== TRAINING & ROUTINES ==========
  {
    memory_type: 'preference',
    content: 'User is on 14-day reset plan for premature ejaculation: Daily edging (3 sessions of 10 minutes: 20 strokes → 30 sec rest), daily kegels (3 sets of 20 squeezes, 5-second hold), cold showers on clit (30-60 seconds daily). Also doing phimosis stretching: Daily warm-up + finger stretching + Betnovate-N cream twice daily. Tracking progress in logs.',
    importance: 8,
    strength: 1.0,
    context: {},
    searchKey: 'training'
  },

  // ========== EMOTIONAL STATES ==========
  {
    memory_type: 'emotional_state',
    content: 'User fears "rabbit hole" (getting too deep), fears getting old/losing self, is scared but wants to proceed, feels relief when validated, has guilt after headspace (wants to overcome), fears being "not normal", fears discovery (coworker, wife).',
    importance: 7,
    strength: 1.0,
    context: {},
    searchKey: 'fears'
  },

  // ========== GOALS ==========
  {
    memory_type: 'preference',
    content: 'User goals: Cure phimosis (4-8 weeks), fix premature ejaculation (14-day reset, then 35+ days), achieve hands-free anal orgasms, full feminization transformation, daily edging without spilling, accept identity fully ("head outside").',
    importance: 8,
    strength: 1.0,
    context: {},
    searchKey: 'goals'
  }
]

// Helper to normalize text for comparison
function normalize(text) {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

// Helper to check if two memories are similar
function areSimilar(mem1, mem2) {
  const norm1 = normalize(mem1.content)
  const norm2 = normalize(mem2.content)
  
  // Exact match
  if (norm1 === norm2) return true
  
  // Check if they share the same search key
  if (mem1.searchKey && mem2.searchKey && mem1.searchKey === mem2.searchKey) {
    return true
  }
  
  // For nicknames, check if they mention the same term
  if (mem1.memory_type === 'preference' && mem2.memory_type === 'preference') {
    const nicknamePattern = /(?:responds positively to being called|prefers to be called):\s*([^.,]+)/i
    const match1 = mem1.content.match(nicknamePattern)
    const match2 = mem2.content.match(nicknamePattern)
    if (match1 && match2) {
      return normalize(match1[1]) === normalize(match2[1])
    }
  }
  
  // Check if content is very similar (80% overlap)
  const words1 = norm1.split(/\s+/)
  const words2 = norm2.split(/\s+/)
  const commonWords = words1.filter(w => words2.includes(w))
  const similarity = commonWords.length / Math.max(words1.length, words2.length)
  
  return similarity > 0.8
}

async function updateMemories() {
  try {
    console.log(`\n📝 Processing ${meaningfulMemories.length} meaningful memories...`)
    console.log(`Persona ID: ${personaId || 'null (shared)'}\n`)

    // Get existing memories
    let memoryQuery = supabase
      .from('memories')
      .select('id, content, memory_type, persona_id')
      .eq('user_id', userId)
    
    if (personaId) {
      memoryQuery = memoryQuery.eq('persona_id', personaId)
    } else {
      memoryQuery = memoryQuery.is('persona_id', null)
    }
    
    const { data: existingMemories, error: fetchError } = await memoryQuery

    if (fetchError) {
      throw fetchError
    }

    console.log(`📊 Found ${existingMemories?.length || 0} existing memories for this persona\n`)

    const toUpdate = []
    const toInsert = []
    const skipped = []

    for (const newMemory of meaningfulMemories) {
      // Find matching existing memory
      const existing = existingMemories?.find(existingMem => 
        areSimilar(newMemory, existingMem)
      )

      if (existing) {
        // Check if content is different
        if (normalize(existing.content) !== normalize(newMemory.content)) {
          toUpdate.push({
            id: existing.id,
            memory: newMemory,
            reason: 'content_update'
          })
        } else {
          skipped.push({
            id: existing.id,
            reason: 'already_exists'
          })
        }
      } else {
        // New memory to insert
        toInsert.push(newMemory)
      }
    }

    console.log(`📊 Analysis:`)
    console.log(`   - To update: ${toUpdate.length}`)
    console.log(`   - To insert: ${toInsert.length}`)
    console.log(`   - Already up-to-date: ${skipped.length}\n`)

    // Update existing memories
    if (toUpdate.length > 0) {
      console.log(`🔄 Updating ${toUpdate.length} existing memories...`)
      for (const { id, memory } of toUpdate) {
        const { error: updateError } = await supabase
          .from('memories')
          .update({
            content: memory.content,
            importance: memory.importance,
            strength: 1.0, // Reset strength
            context: memory.context,
            last_accessed: new Date().toISOString(),
          })
          .eq('id', id)

        if (updateError) {
          console.error(`  ❌ Error updating memory ${id.substring(0, 8)}...:`, updateError.message)
        } else {
          console.log(`  ✓ Updated: ${memory.content.substring(0, 60)}...`)
        }
      }
      console.log('')
    }

    // Insert new memories
    if (toInsert.length > 0) {
      console.log(`➕ Inserting ${toInsert.length} new memories...`)
      const batchSize = 50
      
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize)
        const { data, error: insertError } = await supabase
          .from('memories')
          .insert(
            batch.map(m => ({
              user_id: userId,
              persona_id: personaId || null,
              memory_type: m.memory_type,
              content: m.content,
              importance: m.importance,
              strength: m.strength,
              context: m.context,
            }))
          )
          .select()

        if (insertError) {
          console.error(`  ❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError.message)
        } else {
          console.log(`  ✓ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} memories`)
        }
      }
      console.log('')
    }

    console.log(`✅ Successfully processed memories!`)
    console.log(`\n📊 Summary:`)
    console.log(`   - Total meaningful memories: ${meaningfulMemories.length}`)
    console.log(`   - Updated: ${toUpdate.length}`)
    console.log(`   - Inserted: ${toInsert.length}`)
    console.log(`   - Already up-to-date: ${skipped.length}`)
    console.log(`   - Persona: ${personaId || 'Shared (null)'}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
updateMemories()

