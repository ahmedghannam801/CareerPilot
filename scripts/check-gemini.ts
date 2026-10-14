import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });
import { GoogleGenAI } from '@google/genai';
import { getCandidateModels } from '../src/server/ai/gateway.js';

// Usage: npm run check:ai   (reads GEMINI_API_KEY from .env / .env.local)
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('GEMINI_API_KEY is missing. Put it in .env.local');
  process.exit(1);
}
console.log(`Key loaded: ${key.slice(0, 4)}... (length ${key.length})`);
const client = new GoogleGenAI({ apiKey: key });

try {
  const names: string[] = [];
  const pager = await client.models.list();
  for await (const m of pager) if (m.name?.includes('flash')) names.push(m.name.replace('models/', ''));
  console.log('\nFlash models your key can see:\n  ' + (names.join('\n  ') || '(none)'));
} catch (e) {
  console.log('\nCould not list models:', e instanceof Error ? e.message : e);
}

console.log('\nTesting the models the app will try, in order:');
for (const model of getCandidateModels()) {
  const t = Date.now();
  try {
    const r = await client.models.generateContent({ model, contents: 'Reply with the single word OK' });
    console.log(`  OK    ${model}  ${Date.now() - t}ms  -> ${(r.text ?? '').trim().slice(0, 20)}`);
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').slice(0, 220);
    console.log(`  FAIL  ${model}  ${Date.now() - t}ms  -> ${msg}`);
  }
}
