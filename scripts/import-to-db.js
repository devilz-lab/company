const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

// Set environment variables
Object.keys(envVars).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = envVars[key];
  }
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const userId = '00000000-0000-0000-0000-000000000001';

// Simple memory extraction (matching the TypeScript version)
function extractMemories(messages, userId, personaId = null) {
  const memories = [];
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  userMessages.forEach((msg, idx) => {
    const content = msg.content.toLowerCase();

    // Nickname patterns
    const nicknamePatterns = [
      /\b(call me|you can call me|i like being called|i prefer|nickname is|just call me)\s+([a-z]+)/i,
      /\b(i'm|i am)\s+([a-z]+)\s+(to you|for you)/i,
      /\b(refer to me as|address me as)\s+([a-z]+)/i,
    ];
    
    nicknamePatterns.forEach(pattern => {
      const match = msg.content.match(pattern);
      if (match) {
        const nickname = match[2] || match[1];
        memories.push({
          user_id: userId,
          persona_id: personaId,
          memory_type: 'preference',
          content: `User prefers to be called: ${nickname}. Use this naturally in conversations.`,
          importance: 9,
          strength: 1.0,
          context: { conversation_index: idx, extracted_nickname: nickname },
        });
      }
    });

    // Preference patterns
    if (content.match(/\b(i like|i love|i enjoy|i prefer|i'm into|i'm a fan of|i appreciate)\b/i)) {
      const preferenceMatch = msg.content.match(/\b(i like|i love|i enjoy|i prefer|i'm into|i'm a fan of|i appreciate)\s+(.+?)(?:\.|$|,)/i);
      const preference = preferenceMatch ? preferenceMatch[2].trim() : msg.content;
      
      memories.push({
        user_id: userId,
        persona_id: personaId,
        memory_type: 'preference',
        content: `User likes/prefers: ${preference}`,
        importance: 8,
        strength: 1.0,
        context: { conversation_index: idx, original_message: msg.content },
      });
    }

    // Boundary patterns
    if (content.match(/\b(i don't|i won't|not into|limit|hard limit|boundary)\b/i)) {
      memories.push({
        user_id: userId,
        persona_id: personaId,
        memory_type: 'boundary',
        content: msg.content,
        importance: 10,
        strength: 1.0,
        context: { conversation_index: idx },
      });
    }
  });

  // Extract from assistant messages
  assistantMessages.forEach((assistantMsg, aIdx) => {
    const endearmentPatterns = [
      /\b(princess|pet|babygirl|sissy|sweetheart|baby|honey|darling|love|dear|babe|sugar|good girl|my little|my sweet)\b/gi,
    ];
    
    endearmentPatterns.forEach(pattern => {
      const matches = [...assistantMsg.content.matchAll(pattern)];
      for (const match of matches) {
        const term = match[1] || match[0];
        const nextUserMsg = userMessages.find((_, uIdx) => uIdx > aIdx);
        const respondedPositively = nextUserMsg?.content.match(/\b(yes|love|like|thanks|thank you|good|perfect|mistress|ma'am|mommy|goddess)\b/i);
        
        if (respondedPositively || term.toLowerCase().includes('princess') || term.toLowerCase().includes('pet')) {
          memories.push({
            user_id: userId,
            persona_id: personaId,
            memory_type: 'preference',
            content: `User responds positively to being called: ${term}. Use this naturally in conversations.`,
            importance: 9,
            strength: 1.0,
            context: { conversation_index: aIdx, term_of_endearment: term },
          });
        }
      }
    });
  });

  // Communication style
  if (assistantMessages.some(m => 
    m.content.match(/\b(tell me|confess|obey|speak|answer|breathe|kneel|good girl|pet|princess)\b/i) ||
    m.content.length > 500
  )) {
    memories.push({
      user_id: userId,
      persona_id: personaId,
      memory_type: 'preference',
      content: 'User prefers dominant, psychological, interrogative communication style with detailed responses. Use commands, questions, and build psychological tension.',
      importance: 8,
      strength: 1.0,
      context: {},
    });
  }

  return memories;
}

async function importConversation() {
  try {
    // Read parsed messages
    const parsedPath = path.join(__dirname, '../convo-parsed.json');
    if (!fs.existsSync(parsedPath)) {
      console.error('Please run: node scripts/import-convo.js first');
      process.exit(1);
    }

    const { messages } = JSON.parse(fs.readFileSync(parsedPath, 'utf-8'));
    console.log(`\nImporting ${messages.length} messages...`);

    // Extract memories
    console.log('Extracting memories...');
    const extractedMemories = extractMemories(messages, userId, null);
    console.log(`Extracted ${extractedMemories.length} memories`);

    if (extractedMemories.length === 0) {
      console.log('No memories extracted');
      return;
    }

    // Save in batches
    const batchSize = 50;
    let savedCount = 0;

    for (let i = 0; i < extractedMemories.length; i += batchSize) {
      const batch = extractedMemories.slice(i, i + batchSize);
      console.log(`Saving batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(extractedMemories.length / batchSize)}...`);

      const { data, error } = await supabase
        .from('memories')
        .insert(
          batch.map(m => ({
            user_id: m.user_id,
            persona_id: m.persona_id,
            memory_type: m.memory_type,
            content: m.content,
            importance: m.importance,
            strength: m.strength,
            context: m.context,
          }))
        )
        .select();

      if (error) {
        console.error(`Error saving batch:`, error);
      } else {
        savedCount += data?.length || 0;
        console.log(`Saved ${savedCount} of ${extractedMemories.length} memories`);
      }
    }

    // Analyze
    const nicknameMemories = extractedMemories.filter(m => 
      m.content.toLowerCase().includes('prefers to be called') ||
      m.content.toLowerCase().includes('responds positively to being called')
    );
    
    const preferenceMemories = extractedMemories.filter(m => 
      m.memory_type === 'preference' && 
      !m.content.toLowerCase().includes('prefers to be called') &&
      !m.content.toLowerCase().includes('responds positively')
    );

    console.log('\n=== IMPORT SUMMARY ===');
    console.log(`Total memories: ${extractedMemories.length}`);
    console.log(`Nicknames: ${nicknameMemories.length}`);
    console.log(`Preferences: ${preferenceMemories.length}`);
    console.log(`\nNicknames found:`);
    nicknameMemories.forEach(m => console.log(`  - ${m.content}`));
    console.log(`\nTop preferences:`);
    preferenceMemories.slice(0, 10).forEach(m => console.log(`  - ${m.content}`));

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importConversation();

