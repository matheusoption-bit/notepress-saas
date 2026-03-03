/**
 * ai-test.ts — Validação dos 5 providers do Quadripartite Brain
 *
 * Para rodar:
 *   npx tsx src/lib/ai-test.ts
 *
 * Variáveis de ambiente necessárias (.env):
 *   AI_GOOGLE_KEY    — Google Gemini
 *   DEEPSEEK_API_KEY — DeepSeek
 *   GROQ_API_KEY     — Groq / Llama
 *   IBM_WATSONX_API_KEY + IBM_WATSONX_PROJECT_ID + IBM_WATSONX_URL — WatsonX
 */

import { generateText } from 'ai';
import { quadripartiteProviders } from './ai-providers';

const PROMPT = 'Em uma frase, qual é o principal edital de inovação aberto no Brasil em 2025?';

type ProviderKey = keyof typeof quadripartiteProviders;

const PROVIDERS: ProviderKey[] = [
  'GEMINI_SEARCH',
  'GEMINI_CREATE',
  'DEEPSEEK',
  'LLAMA',
  'WATSONX_BR',
];

async function testProvider(key: ProviderKey): Promise<void> {
  const model = quadripartiteProviders[key];
  const start = Date.now();

  try {
    const { text, usage } = await generateText({
      model,
      prompt: PROMPT,
      maxOutputTokens: 200,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`\n✅ [${key}] (${elapsed}s)`);
    console.log(`   Resposta: ${text.trim().slice(0, 200)}`);
    if (usage) {
      console.log(`   Tokens: ${usage.inputTokens ?? '?'} in / ${usage.outputTokens ?? '?'} out`);
    }
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ [${key}] (${elapsed}s) FALHOU: ${msg.slice(0, 200)}`);
  }
}

async function main() {
  console.log('🧠 Notepress Brain — Validação dos providers Quadripartite\n');
  console.log(`Prompt: "${PROMPT}"\n`);
  console.log('─'.repeat(60));

  // Testa todos em paralelo para agilidade
  await Promise.allSettled(PROVIDERS.map(testProvider));

  console.log('\n─'.repeat(60));
  console.log('✔  Teste concluído.\n');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
