/**
 * src/lib/ai/ai-providers.ts
 *
 * Re-exporta a implementação canônica de src/lib/ai-providers.ts.
 * Esta camada existe apenas para que os módulos do subdiretório ai/
 * possam importar com caminho relativo curto (./ai-providers).
 *
 * Fonte da verdade: src/lib/ai-providers.ts
 */
export * from '../ai-providers';

// ─── Validação de variáveis de ambiente ───────────────────────────────────────
export function validateEnvProviders(): string[] {
  const missing: string[] = [];
  if (!process.env.AI_GOOGLE_KEY)    missing.push('AI_GOOGLE_KEY (GEMINI)');
  if (!process.env.DEEPSEEK_API_KEY) missing.push('DEEPSEEK_API_KEY (DEEPSEEK)');
  if (!process.env.GROQ_API_KEY)     missing.push('GROQ_API_KEY (LLAMA)');
  if (missing.length > 0) {
    console.warn('[notepress] Providers ausentes:', missing.join(', '));
  }
  return missing;
}
