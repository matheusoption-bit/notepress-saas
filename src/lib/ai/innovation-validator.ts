/**
 * innovation-validator.ts
 *
 * Valida se uma solução/inovação possui anterioridade em patentes ou literatura
 * acadêmica. Fluxo:
 *
 *   1. Se lensToken  → busca real no Lens.org Patent Search
 *   2. Se serpKey    → busca complementar via SerpApi (Google Patents)
 *   3. Sempre        → análise estruturada via Gemini 2.5 Flash
 *   4. Combina       → patentes reais + análise IA no resultado final
 *
 * Persiste o resultado em `InnovationValidation` (Prisma).
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { geminiProvider as gemini } from './ai-providers';
import { prisma } from '@/lib/prisma';

// ─── Tipo de patente (compatível com InnovationValidatorNode) ─────────────────

export interface PatentResult {
  title: string;
  source: string;     // "Lens.org" | "Google Patents" | etc.
  url: string;
  similarity: number; // 0–100
  abstract?: string;
}

// ─── Schema de resultado ──────────────────────────────────────────────────────

export const InnovationResultSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe('Grau de inovação de 0 a 100 (0 = totalmente existente, 100 = altamente original)'),

  level: z
    .enum(['INCREMENTAL', 'MODERADA', 'RADICAL', 'DISRUPTIVA'])
    .describe('Nível de inovação classificado pelo score'),

  veredicto: z
    .enum(['INOVACAO_CONFIRMADA', 'PARCIALMENTE_NOVO', 'ANTERIORIDADE_ENCONTRADA'])
    .describe('Resultado da análise de anterioridade'),

  anterioridades: z
    .array(
      z.object({
        titulo: z.string().describe('Título do documento/patente encontrado'),
        fonte: z.string().describe('INPI, Google Patents, Lens.org, Scopus, etc.'),
        url: z.string().optional().describe('URL do documento'),
        similaridade: z
          .number()
          .min(0)
          .max(100)
          .describe('Percentual de similaridade com a inovação analisada'),
        relevancia: z
          .enum(['ALTA', 'MEDIA', 'BAIXA'])
          .describe('Relevância para invalidação da inovação'),
      })
    )
    .describe('Lista de anterioridades encontradas'),

  recomendacoes: z
    .array(z.string())
    .describe('Sugestões para diferenciar a inovação ou contornar anterioridades'),

  fontesPesquisadas: z
    .array(z.string())
    .describe('Bases de dados consultadas na busca'),

  explanation: z
    .string()
    .describe('Parágrafo explicativo sobre o nível de inovação encontrado'),
});

export type InnovationResult = z.infer<typeof InnovationResultSchema>;

// ─── System prompt especializado ──────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um especialista em propriedade intelectual e inovação tecnológica no Brasil, com experiência em análise de anterioridades e patentes.

Sua missão é analisar descrições de soluções inovadoras e identificar se existem anterioridades (patentes, artigos, registros) que possam comprometer a originalidade da inovação.

FONTES PRIORITÁRIAS A PESQUISAR:
1. INPI (Instituto Nacional da Propriedade Industrial) — inpi.gov.br
2. Google Patents — patents.google.com
3. Lens.org — plataforma global de patentes e literatura
4. EPO Espacenet — plataforma europeia de patentes
5. Scopus / Web of Science — literatura acadêmica
6. PATENTSCOPE (WIPO) — patentes internacionais

CRITÉRIOS DE ANÁLISE:
- Foque em patentes depositadas nos últimos 20 anos
- Priorize registros brasileiros, mas inclua internacionais relevantes
- Analise semelhança funcional, não apenas textual
- Considere o estado da arte no setor específico

CLASSIFICAÇÃO DE NÍVEIS:
- INCREMENTAL  → score  0–59  (melhoria incremental sobre tecnologia existente)
- MODERADA     → score 60–74  (inovação com diferencial claro, mas com precedentes)
- RADICAL      → score 75–89  (solução significativamente nova com poucas anterioridades)
- DISRUPTIVA   → score 90–100 (altamente original, sem anterioridades relevantes)

FORMATO DE RESPOSTA: Use exatamente o esquema JSON solicitado. Seja preciso nos scores (0–100).`;

// ─── Funções de busca de patentes ─────────────────────────────────────────────

/**
 * Busca patentes no Lens.org usando a API REST oficial.
 * Documentação: https://docs.api.lens.org/
 *
 * @param query     Termos de busca derivados da solução
 * @param token     Bearer token do usuário (lensApiToken decriptografado)
 * @returns         Lista normalizada de PatentResult
 */
export async function searchLensPatents(
  query: string,
  token: string,
): Promise<PatentResult[]> {
  const body = {
    query: {
      bool: {
        should: [
          { match: { 'title.text': query } },
          { match: { 'abstract.text': query } },
          { match: { 'claims.text': query } },
        ],
        minimum_should_match: 1,
      },
    },
    size: 5,
    sort: [{ _score: 'desc' }],
    include: ['lens_id', 'title', 'abstract', 'biblio.publication_reference'],
  };

  const res = await fetch('https://api.lens.org/patent/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.warn(`[Lens.org] Status ${res.status} — ${await res.text().catch(() => '')}`);
    return [];
  }

  const data = await res.json() as {
    hits?: {
      hits?: Array<{
        _score?: number;
        _source?: {
          lens_id?: string;
          title?: { text?: string }[];
          abstract?: { text?: string }[];
        };
      }>;
      max_score?: number;
    };
  };

  const hits = data?.hits?.hits ?? [];
  const maxScore = data?.hits?.max_score ?? 1;

  return hits.map((hit) => {
    const src = hit._source ?? {};
    const title = src.title?.[0]?.text ?? 'Patente sem título';
    const abstract = src.abstract?.[0]?.text;
    const lensId = src.lens_id ?? '';
    const rawScore = hit._score ?? 0;
    const similarity = Math.round((rawScore / Math.max(maxScore, 1)) * 100);

    return {
      title,
      source: 'Lens.org',
      url: lensId ? `https://lens.org/${lensId}` : 'https://lens.org',
      similarity,
      abstract,
    } satisfies PatentResult;
  });
}

/**
 * Busca patentes via SerpApi (engine: google_patents).
 * Documentação: https://serpapi.com/google-patents-api
 *
 * @param query   Termos de busca
 * @param serpKey Chave de API SerpApi (decriptografada)
 * @returns       Lista normalizada de PatentResult
 */
export async function searchGooglePatents(
  query: string,
  serpKey: string,
): Promise<PatentResult[]> {
  const params = new URLSearchParams({
    engine: 'google_patents',
    q: query,
    api_key: serpKey,
    num: '5',
    hl: 'pt',
  });

  const res = await fetch(`https://serpapi.com/search?${params}`, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.warn(`[SerpApi] Status ${res.status} — ${await res.text().catch(() => '')}`);
    return [];
  }

  const data = await res.json() as {
    organic_results?: Array<{
      title?: string;
      snippet?: string;
      link?: string;
      patent_id?: string;
    }>;
  };

  const results = data?.organic_results ?? [];

  // SerpApi não retorna score de similaridade diretamente;
  // usamos a posição no ranking para estimar (1º = 80%, 5º = 50%).
  return results.map((item, idx) => ({
    title:      item.title ?? 'Patente sem título',
    source:     'Google Patents',
    url:        item.link ?? `https://patents.google.com/?q=${encodeURIComponent(query)}`,
    similarity: Math.max(50, 80 - idx * 6),
    abstract:   item.snippet,
  } satisfies PatentResult));
}

// ─── Função principal ─────────────────────────────────────────────────────────

export interface ValidateInnovationInput {
  /** Descrição detalhada da solução a validar */
  solutionDescription: string;
  /** Setor ou área tecnológica da solução */
  sector?: string;
  /** ID do notebook relacionado (para persistência) */
  notebookId: string;
  /** ID do usuário autenticado (para persistência) */
  userId: string;
  /** Token Lens.org já decriptografado (opcional) */
  lensToken?: string;
  /** Chave SerpApi já decriptografada (opcional) */
  serpKey?: string;
}

export interface ValidateInnovationOutput {
  /** ID do registro persistido */
  validationId: string;
  /** Resultado estruturado da análise */
  result: InnovationResult;
  /** Patentes reais encontradas (Lens + SerpApi) */
  patentResults: PatentResult[];
}

/**
 * Valida se uma solução possui anterioridade em patentes/literatura.
 * Se tokens estiverem disponíveis, inclui resultados reais de patentes.
 * Persiste o resultado em `InnovationValidation` e retorna os dados estruturados.
 */
export async function validateInnovation(
  input: ValidateInnovationInput,
): Promise<ValidateInnovationOutput> {
  const { solutionDescription, sector, notebookId, userId, lensToken, serpKey } = input;

  // ── 1. Busca real de patentes (paralela) ──────────────────────────────────
  const searchQuery = [
    solutionDescription.slice(0, 200),
    sector,
  ]
    .filter(Boolean)
    .join(' ');

  const [lensResults, serpResults] = await Promise.all([
    lensToken ? searchLensPatents(searchQuery, lensToken) : Promise.resolve([] as PatentResult[]),
    serpKey   ? searchGooglePatents(searchQuery, serpKey) : Promise.resolve([] as PatentResult[]),
  ]);

  // Remove duplicatas por título (normalizado)
  const seenTitles = new Set<string>();
  const patentResults: PatentResult[] = [...lensResults, ...serpResults].filter((p) => {
    const key = p.title.toLowerCase().trim().slice(0, 80);
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });

  // ── 2. Análise por IA ─────────────────────────────────────────────────────
  const patentContext =
    patentResults.length > 0
      ? `\n\nPATENTES JÁ ENCONTRADAS (considere ao pontuar):\n` +
        patentResults
          .map((p, i) => `${i + 1}. [${p.source}] ${p.title} — ${p.similarity}% similar`)
          .join('\n')
      : '';

  const prompt = [
    `SOLUÇÃO A ANALISAR:`,
    solutionDescription,
    sector ? `\nSETOR TECNOLÓGICO: ${sector}` : '',
    patentContext,
    `\nPor favor, realize uma análise completa de anterioridades e retorne o resultado estruturado.`,
  ]
    .filter(Boolean)
    .join('\n');

  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: InnovationResultSchema,
    system: SYSTEM_PROMPT,
    prompt,
  });

  // ── 3. Persistência ───────────────────────────────────────────────────────
  const record = await prisma.innovationValidation.create({
    data: {
      notebookId,
      userId,
      query: solutionDescription,
      result: { ...object, patentResults } as object,
      score: object.score,
    },
  });

  return {
    validationId: record.id,
    result: object,
    patentResults,
  };
}

/**
 * Busca histórico de validações de um notebook.
 */
export async function getValidationHistory(notebookId: string, limit = 10) {
  return prisma.innovationValidation.findMany({
    where: { notebookId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      query: true,
      score: true,
      result: true,
    },
  });
}
