/**
 * edital-enricher.ts
 *
 * Enriquece editais de fomento com insights de IA usando a Perplexity Sonar.
 * Analisa relevância, tendência e potencial para PMEs inovadoras.
 *
 * Padrão: adaptado do "Financial News Tracker" do api-cookbook oficial.
 *
 * Usado por: HotEditais (dashboard), pipeline de ingestão de novos editais.
 */

import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { gemini, groq } from './ai-providers';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const EditalEnrichmentSchema = z.object({
  relevanciaScore: z
    .number()
    .min(0)
    .max(10)
    .describe('Score de relevância geral para PMEs inovadoras (0-10)'),

  tendencia: z
    .enum(['ALTA', 'ESTAVEL', 'BAIXA'])
    .describe('Tendência de demanda por este tipo de edital'),

  dificuldade: z
    .enum(['BAIXA', 'MEDIA', 'ALTA', 'MUITO_ALTA'])
    .describe('Nível de dificuldade para aprovação'),

  perfilIdeal: z
    .object({
      porteEmpresa: z.array(z.enum(['MEI', 'ME', 'EPP', 'MEDIO', 'GRANDE'])),
      setores: z.array(z.string()).describe('Setores com maior chance de aprovação'),
      trlMinimo: z.number().min(1).max(9).optional(),
    })
    .describe('Perfil de empresa com maior probabilidade de aprovação'),

  insights: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe('Insights estratégicos sobre este edital'),

  riscos: z
    .array(z.string())
    .max(3)
    .describe('Principais riscos ou cuidados ao se inscrever'),

  editaisSimilares: z
    .array(
      z.object({
        nome: z.string(),
        orgao: z.string(),
        status: z.string(),
      })
    )
    .max(3)
    .describe('Editais similares que costumam abrir no mesmo período'),

  palavrasChave: z
    .array(z.string())
    .max(8)
    .describe('Tags/palavras-chave para categorização'),
});

export type EditalEnrichment = z.infer<typeof EditalEnrichmentSchema>;

// ─── Schema de resumo para HotEditais ────────────────────────────────────────

export const EditalSummarySchema = z.object({
  manchete: z.string().describe('Título de impacto em até 80 caracteres'),
  subtitulo: z.string().describe('Subtítulo explicativo em até 150 caracteres'),
  callToAction: z.string().describe('Texto do botão de ação (ex: "Ver Oportunidade")'),
  badge: z.enum(['URGENTE', 'NOVO', 'POPULAR', 'ALTA_TAXA', 'DESTAQUE']).optional(),
});

export type EditalSummary = z.infer<typeof EditalSummarySchema>;

// ─── System prompt ────────────────────────────────────────────────────────────

const ENRICHMENT_SYSTEM = `Você é um especialista em editais de fomento à inovação no Brasil com 15 anos de experiência auxiliando startups e PMEs a identificar e ganhar financiamentos públicos (FINEP, CNPq, BNDES, EMBRAPII, Sebrae, FAPs estaduais, etc.).

Analise editais e forneça insights estratégicos e acionáveis. Use dados atuais do ecossistema brasileiro de inovação para contextualizar sua análise.

Seja objetivo e pragmático — os usuários precisam decidir rapidamente se vale a pena investir tempo em uma candidatura.`;

// ─── Funções principais ───────────────────────────────────────────────────────

export interface EnrichEditalInput {
  nome: string;
  orgao: string;
  tipoInstrumento: string;
  abrangencia: string;
  temas: string[];
  valorMin?: number;
  valorMax?: number;
  resumo?: string;
  trlEntrada?: number;
  trlSaida?: number;
  prazoExecucao?: string;
  contrapartida?: string;
}

/**
 * Enriquece um edital com análise de IA completa.
 * Retorna estrutura tipada para exibição no dashboard e listagens.
 */
export async function enrichEdital(input: EnrichEditalInput): Promise<EditalEnrichment> {
  const prompt = buildEditalPrompt(input);

  const { object } = await generateObject({
    model: gemini('gemini-2.5-flash'),
    schema: EditalEnrichmentSchema,
    system: ENRICHMENT_SYSTEM,
    prompt,
  });

  return object;
}

/**
 * Gera apenas manchete e subtítulo para exibição rápida no HotEditais.
 * Usa modelo mais barato (sonar small) para economia.
 */
export async function generateEditalSummary(input: EnrichEditalInput): Promise<EditalSummary> {
  const prompt =
    `Crie um resumo atraente para o seguinte edital de fomento:\n\n` +
    `Nome: ${input.nome}\n` +
    `Órgão: ${input.orgao}\n` +
    `Tipo: ${input.tipoInstrumento}\n` +
    `Temas: ${input.temas.join(', ')}\n` +
    (input.valorMax ? `Valor máximo: R$ ${input.valorMax.toLocaleString('pt-BR')}\n` : '') +
    (input.resumo ? `Resumo oficial: ${input.resumo}\n` : '');

  const { object } = await generateObject({
    model: groq('llama-3.3-70b-versatile'),
    schema: EditalSummarySchema,
    system:
      'Você cria títulos e chamadas atraentes para editais de fomento. ' +
      'Use linguagem direta, impactante e orientada para PMEs e startups brasileiras.',
    prompt,
  });

  return object;
}

/**
 * Gera uma análise comparativa entre múltiplos editais abertos.
 * Útil para recomendar o melhor edital para um perfil de empresa específico.
 */
export async function compareEditais(
  editais: EnrichEditalInput[],
  empresaPerfil: string
): Promise<string> {
  if (editais.length === 0) return 'Nenhum edital para comparar.';
  if (editais.length > 5) {
    editais = editais.slice(0, 5); // limita para economizar tokens
  }

  const editaisText = editais
    .map(
      (e, i) =>
        `EDITAL ${i + 1}: ${e.nome} (${e.orgao})\n` +
        `Tipo: ${e.tipoInstrumento} | Temas: ${e.temas.join(', ')}\n` +
        (e.valorMax ? `Valor: até R$ ${e.valorMax.toLocaleString('pt-BR')}\n` : '')
    )
    .join('\n---\n');

  const { text } = await generateText({
    model: gemini('gemini-2.5-flash'),
    system: ENRICHMENT_SYSTEM,
    prompt:
      `Compare os seguintes editais e indique qual é mais adequado para este perfil de empresa:\n\n` +
      `PERFIL DA EMPRESA: ${empresaPerfil}\n\n` +
      `EDITAIS:\n${editaisText}\n\n` +
      `Forneça uma análise comparativa direta com recomendação clara.`,
    maxOutputTokens: 1024,
  });

  return text;
}

/**
 * Analisa em tempo real se um edital ainda está válido/aberto e
 * busca atualizações ou prorrogações recentes.
 */
export async function checkEditalStatus(nomeEdital: string, orgao: string): Promise<string> {
  const { text } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system:
      'Você pesquisa o status atual de editais de fomento no Brasil. ' +
      'Informe se está aberto, encerrado, ou se houve prorrogação, com links quando disponíveis.',
    prompt:
      `Qual o status atual do edital "${nomeEdital}" do ${orgao}? ` +
      `Houve alguma prorrogação ou atualização recente? Pesquise e responda com dados atualizados.`,
    maxOutputTokens: 512,
  });

  return text;
}

// ─── Helper interno ───────────────────────────────────────────────────────────

function buildEditalPrompt(input: EnrichEditalInput): string {
  const lines = [
    `EDITAL A ANALISAR:`,
    `Nome: ${input.nome}`,
    `Órgão/Financiador: ${input.orgao}`,
    `Tipo de Instrumento: ${input.tipoInstrumento}`,
    `Abrangência: ${input.abrangencia}`,
    `Temas/Áreas: ${input.temas.join(', ')}`,
    input.valorMin !== undefined
      ? `Valor mínimo: R$ ${input.valorMin.toLocaleString('pt-BR')}`
      : null,
    input.valorMax !== undefined
      ? `Valor máximo: R$ ${input.valorMax.toLocaleString('pt-BR')}`
      : null,
    input.trlEntrada ? `TRL exigido (entrada): ${input.trlEntrada}` : null,
    input.trlSaida ? `TRL esperado (saída): ${input.trlSaida}` : null,
    input.prazoExecucao ? `Prazo de execução: ${input.prazoExecucao}` : null,
    input.contrapartida ? `Contrapartida: ${input.contrapartida}` : null,
    input.resumo ? `\nDescrição oficial:\n${input.resumo}` : null,
    `\nAnalise este edital e forneça um enriquecimento estratégico completo.`,
  ];

  return lines.filter(Boolean).join('\n');
}
