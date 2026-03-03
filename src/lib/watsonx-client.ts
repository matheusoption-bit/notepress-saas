/**
 * watsonx-client.ts
 *
 * Wrapper para o IBM WatsonX AI usando o endpoint OpenAI-compatible nativo.
 * Compatível com Vercel AI SDK v6 (LanguageModel).
 *
 * Fluxo:
 *   1. Busca IAM Token em https://iam.cloud.ibm.com/identity/token
 *   2. Cacheia o token (válido por ~1h, renova com 60s de antecedência)
 *   3. Usa createOpenAI com fetch customizado que:
 *      - Reescreve /chat/completions → /text/chat?version=...&project_id=...
 *      - Injeta Bearer token no header Authorization
 *
 * Env vars necessárias:
 *   IBM_WATSONX_API_KEY    — API key do IBM Cloud (IAM)
 *   IBM_WATSONX_PROJECT_ID — ID do projeto no watsonx.ai
 *   IBM_WATSONX_URL        — https://us-south.ml.cloud.ibm.com (padrão)
 */

import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

// ─── Cache do IAM Token ────────────────────────────────────────────────────────

interface TokenCache {
  token: string;
  expiresAt: number; // timestamp ms
}

let _tokenCache: TokenCache | null = null;

/**
 * Obtém (ou renova) o IAM access token da IBM Cloud.
 * Tokens têm validade de ~3600s; renovamos com 60s de antecedência.
 */
async function getIamToken(): Promise<string> {
  const now = Date.now();
  const MARGIN_MS = 60_000;

  if (_tokenCache && _tokenCache.expiresAt > now + MARGIN_MS) {
    return _tokenCache.token;
  }

  const apiKey = process.env.IBM_WATSONX_API_KEY;
  if (!apiKey) {
    throw new Error('[watsonx] IBM_WATSONX_API_KEY não definida no .env');
  }

  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[watsonx] IBM IAM auth falhou: ${res.status} — ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  _tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return _tokenCache.token;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Cria um LanguageModel compatível com o Vercel AI SDK v6 para o IBM WatsonX.
 *
 * @param modelId    ex: 'ibm/granite-3-8b-instruct'
 * @param projectId  IBM WatsonX project ID
 * @param serviceUrl ex: 'https://us-south.ml.cloud.ibm.com'
 */
export function createWatsonxModel(
  modelId: string,
  projectId: string,
  serviceUrl: string,
): LanguageModel {
  /**
   * Custom fetch que:
   * 1. Substitui o placeholder de auth pelo IAM token real
   * 2. Reescreve a URL de /chat/completions para /text/chat com query params WatsonX
   */
  const watsonxFetch: typeof globalThis.fetch = async (input, init) => {
    const token = await getIamToken();

    // Reescreve URL para o endpoint WatsonX de chat
    // SDK v6 usa /responses (Responses API) ou /chat/completions dependendo do modo
    let url = input.toString();
    url = url.replace('/chat/completions', '/text/chat').replace('/responses', '/text/chat');

    const urlObj = new URL(url);
    urlObj.searchParams.set('version', '2024-05-31');
    urlObj.searchParams.set('project_id', projectId);

    // Injeta IAM token (sobrescreve qualquer Bearer anterior)
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);

    // WatsonX exige project_id também no corpo JSON (além da query string)
    // e usa model_id em vez do campo model padrão OpenAI.
    // O AI SDK v6 envia no formato Responses API (input/max_output_tokens);
    // convertemos para o formato chat WatsonX (messages/max_tokens).
    let body = init?.body;
    if (body && typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);

        // Converte formato Responses API → WatsonX /text/chat
        if (parsed.input && Array.isArray(parsed.input)) {
          // input[].content é array de {type, text}; achatar em string
          parsed.messages = parsed.input.map((msg: { role: string; content: unknown }) => ({
            role: msg.role,
            content: Array.isArray(msg.content)
              ? (msg.content as Array<{ type: string; text?: string; content?: string }>)
                  .map((c) => c.text ?? c.content ?? '')
                  .join('')
              : msg.content,
          }));
          delete parsed.input;
        }

        // max_output_tokens → max_tokens
        if (parsed.max_output_tokens !== undefined) {
          parsed.max_tokens = parsed.max_output_tokens;
          delete parsed.max_output_tokens;
        }

        // model → model_id (formato OpenAI padrão → WatsonX)
        if (parsed.model && !parsed.model_id) {
          parsed.model_id = parsed.model;
          delete parsed.model;
        }

        parsed.project_id = projectId;
        body = JSON.stringify(parsed);
      } catch {
        // body não é JSON válido — passa como está
      }
    }

    const rawResponse = await globalThis.fetch(urlObj.toString(), { ...init, headers, body });

    // Converte a resposta WatsonX (chat.completions) → Responses API (esperado pelo SDK v6)
    if (!rawResponse.ok) return rawResponse;

    try {
      const wx = await rawResponse.json() as {
        id: string;
        choices: Array<{ message: { role: string; content: string }; finish_reason: string }>;
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      const text = wx.choices?.[0]?.message?.content ?? '';
      const responsesFormat = {
        id: `resp_${wx.id}`,
        object: 'response',
        status: 'completed',
        created_at: Math.floor(Date.now() / 1000),
        output: [
          {
            type: 'message',
            id: `msg_${wx.id}`,
            role: 'assistant',
            status: 'completed',
            content: [{ type: 'output_text', text, annotations: [] }],
          },
        ],
        usage: {
          input_tokens: wx.usage?.prompt_tokens ?? 0,
          output_tokens: wx.usage?.completion_tokens ?? 0,
          total_tokens: wx.usage?.total_tokens ?? 0,
          output_tokens_details: { reasoning_tokens: 0 },
        },
      };

      return new Response(JSON.stringify(responsesFormat), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return rawResponse;
    }
  };

  const provider = createOpenAI({
    name: 'watsonx',
    apiKey: 'iam-token-injected-via-fetch', // placeholder — substituído em watsonxFetch
    baseURL: `${serviceUrl}/ml/v1`,
    // @ts-expect-error 'compatibility' existe em runtime mas não nos tipos do @ai-sdk/openai v3
    compatibility: 'compatible', // força /chat/completions em vez da Responses API do SDK v6
    fetch: watsonxFetch,
  });

  return provider(modelId) as LanguageModel;
}

// ─── Instância padrão ─────────────────────────────────────────────────────────

/**
 * Modelo Granite 3.8B — Árbitro de Compliance BR (WATSONX_BR).
 * Lazy: token é buscado apenas na primeira chamada.
 */
export const watsonxGranite = createWatsonxModel(
  'ibm/granite-4-h-small', // granite-3-8b-instruct deprecated em 31/03/2026
  process.env.IBM_WATSONX_PROJECT_ID ?? '',
  process.env.IBM_WATSONX_URL ?? 'https://us-south.ml.cloud.ibm.com',
);
