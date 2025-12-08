const fs = require('fs');
const path = require('path');

// Read the conversation file
const convoPath = path.join(__dirname, '../Convo.txt');
const convoText = fs.readFileSync(convoPath, 'utf-8');

// Parse the conversation
const lines = convoText.split('\n').filter(l => l.trim());
const messages = [];

// Parse unlabeled format (Grok-style)
let currentRole = null;
let currentContent = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (!trimmed) continue;

  // Detect role by content patterns
  const isUserPattern = 
    trimmed.length < 200 && 
    (trimmed.match(/^(yes|no|okay|ok|i|i want|i like|i have|can you|thank you|please|maam|mistress|mommy|goddess|princess)/i) ||
     trimmed.match(/\?$/) ||
     trimmed.length < 100);

  const isAssistantPattern =
    trimmed.length > 150 ||
    trimmed.match(/^(oh|ah|listen|breathe|tell me|good|that's|here's|now|so|look|feel|imagine|picture|close your eyes)/i) ||
    trimmed.match(/^(princess|pet|babygirl|sweetheart|good girl|my little|my sweet|mistress|mommy|goddess)/i);

  if (isUserPattern && !isAssistantPattern) {
    // Save previous message
    if (currentRole && currentContent) {
      messages.push({ role: currentRole, content: currentContent.trim() });
    }
    currentRole = 'user';
    currentContent = trimmed;
  } else if (isAssistantPattern || (!isUserPattern && currentRole === 'assistant')) {
    if (currentRole === 'user' && currentContent) {
      messages.push({ role: 'user', content: currentContent.trim() });
    }
    currentRole = 'assistant';
    currentContent = currentContent ? currentContent + ' ' + trimmed : trimmed;
  } else if (currentRole) {
    // Continue current message
    currentContent += ' ' + trimmed;
  } else {
    // Default to assistant for first message if unclear
    currentRole = 'assistant';
    currentContent = trimmed;
  }
}

// Save last message
if (currentRole && currentContent) {
  messages.push({ role: currentRole, content: currentContent.trim() });
}

console.log(`Parsed ${messages.length} messages`);
console.log(`First few messages:`);
messages.slice(0, 5).forEach((m, i) => {
  console.log(`${i + 1}. [${m.role}] ${m.content.substring(0, 100)}...`);
});

// Save to JSON for import
const outputPath = path.join(__dirname, '../convo-parsed.json');
fs.writeFileSync(outputPath, JSON.stringify({ messages }, null, 2));
console.log(`\nSaved parsed messages to ${outputPath}`);
console.log(`\nNow run: node scripts/import-to-db.js`);

