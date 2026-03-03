/**
 * ai-test.ts — Teste rápido do Vercel AI SDK com Perplexity
 *
 * Para rodar:
 *   npx tsx src/lib/ai-test.ts
 *
 * Para deletar após validação:
 *   rm src/lib/ai-test.ts  (Linux/macOS)
 *   del src\lib\ai-test.ts (Windows CMD)
 *   Remove-Item src\lib\ai-test.ts (PowerShell)
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

async function main() {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error(
      'PERPLEXITY_API_KEY não definida. Adicione ao seu .env ou defina na sessão:\n' +
      '  $env:PERPLEXITY_API_KEY="sua-key-aqui"  (PowerShell)\n' +
      '  export PERPLEXITY_API_KEY="sua-key-aqui" (bash)'
    );
  }

  // Usa o adaptador OpenAI compatível com a API da Perplexity
  const perplexity = createOpenAI({
    name: 'perplexity',
    apiKey,
    baseURL: 'https://api.perplexity.ai',
  });

  console.log('🚀 Enviando prompt para Perplexity (llama-3.1-sonar-small-128k-online)...\n');

  const { text, usage } = await generateText({
    model: perplexity('llama-3.1-sonar-small-128k-online'),
    prompt: 'Quais são os 3 principais editais de inovação abertos no Brasil em 2025? Responda em pt-BR de forma concisa.',
  });

  console.log('✅ Resposta:\n');
  console.log(text);
  console.log('\n📊 Tokens utilizados:', usage);
}

main().catch((err) => {
  console.error('❌ Erro no teste AI:', err.message ?? err);
  process.exit(1);
});
