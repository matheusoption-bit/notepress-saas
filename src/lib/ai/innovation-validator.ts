/**
 * innovation-validator.ts
 *
 * Valida se uma solução/inovação possui anterioridade em patentes ou literatura
 * acadêmica, usando a busca web integrada da Perplexity (modelo Sonar).
 *
 * Padrão: adaptado do "Academic Research Finder" do api-cookbook oficial.
 *
 * Persiste o resultado em `InnovationValidation` (Prisma).
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { geminiProvider as gemini } from './ai-providers';
import { prisma } from '@/lib/prisma';

// ─── Schema de resultado ──────────────────────────────────────────────────────

export const InnovationResultSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe('Grau de inovação (0 = totalmente existente, 10 = original)'),

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

FORMATO DE RESPOSTA: Use exatamente o esquema JSON solicitado. Seja preciso nos scores de similaridade.`;

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
  /** Token da API Lens.org do usuário (opcional — via UserProfile) */
  lensApiToken?: string;
}

export interface ValidateInnovationOutput {
  /** Registro persistido no banco */
  validationId: string;
  /** Resultado estruturado da análise */
  result: InnovationResult;
}

/**
 * Valida se uma solução possui anterioridade em patentes/literatura.
 * Persiste o resultado em `InnovationValidation` e retorna os dados estruturados.
 */
export async function validateInnovation(
  input: ValidateInnovationInput
): Promise<ValidateInnovationOutput> {
  const { solutionDescription, sector, notebookId, userId } = input;

  const prompt = [
    `SOLUÇÃO A ANALISAR:`,
    solutionDescription,
    sector ? `\nSETOR TECNOLÓGICO: ${sector}` : '',
    `\nPor favor, realize uma busca completa de anterioridades e retorne o resultado estruturado.`,
  ]
    .filter(Boolean)
    .join('\n');

  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: InnovationResultSchema,
    system: SYSTEM_PROMPT,
    prompt,
  });

  // Persiste no banco de dados
  const record = await prisma.innovationValidation.create({
    data: {
      notebookId,
      userId,
      query: solutionDescription,
      result: object as object,
      score: object.score,
    },
  });

  return {
    validationId: record.id,
    result: object,
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
