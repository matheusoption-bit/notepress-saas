import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';

export const gemini = createGoogleGenerativeAI({
  apiKey: process.env.AI_GOOGLE_KEY!,
});

export const deepseek = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
});

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const quadripartiteProviders = {
  GEMINI_SEARCH: gemini('gemini-2.5-flash'),
  GEMINI_CREATE: gemini('gemini-2.5-flash'),
  DEEPSEEK:      deepseek('deepseek/deepseek-r1-0528'),
  LLAMA:         groq('llama-3.3-70b-versatile'),
  WATSONX_BR:    groq('llama-3.3-70b-versatile'),
};

export function validateEnvProviders(): string[] {
  const missing: string[] = [];
  if (!process.env.AI_GOOGLE_KEY)        missing.push('AI_GOOGLE_KEY (GEMINI)');
  if (!process.env.OPENROUTER_API_KEY)   missing.push('OPENROUTER_API_KEY (DEEPSEEK via OpenRouter)');
  if (!process.env.GROQ_API_KEY)         missing.push('GROQ_API_KEY (LLAMA)');
  if (missing.length > 0) {
    console.warn('[notepress] Providers ausentes:', missing.join(', '));
  }
  return missing;
}
