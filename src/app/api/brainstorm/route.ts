// src/app/api/brainstorm/route.ts
import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { gpt } from '@/lib/ai-providers';

/**
 * POST /api/brainstorm
 *
 * Recebe `multipart/form-data` com o campo `audio` (Blob/File de áudio WebM/mp4).
 * Fluxo:
 *   1. Whisper (OpenAI) → transcrição em PT-BR (fetch direto — sem suporte no AI SDK)
 *   2. GPT-4o via AI SDK `generateObject` → saída tipada via Zod
 *
 * Se `OPENAI_API_KEY` não estiver configurada, retorna dados de mock para
 * que a funcionalidade possa ser testada sem custo.
 */

const BrainstormOutputSchema = z.object({
  resumo: z.string().describe('Resumo de 1-2 frases da ideia central'),
  planoDeAcao: z.array(z.string()).max(6).describe('Até 6 ações concretas e acionáveis'),
  sugestoesDePesquisa: z.array(z.string()).max(4).describe('Até 4 temas de pesquisa relevantes'),
});
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'Campo `audio` ausente ou inválido.' },
        { status: 400 },
      );
    }

    // ── Modo Mock (sem chave de API) ────────────────────────────
    if (!process.env.OPENAI_API_KEY) {
      await new Promise((r) => setTimeout(r, 1200)); // simula latência
      return NextResponse.json({
        transcricao:
          'A solução proposta visa integrar sensores IoT em biodigestores ' +
          'rurais para monitoramento em tempo real da produção de biogás, ' +
          'reduzindo custos operacionais em até 40%.',
        resumo:
          'Sistema IoT para monitoramento de biodigestores rurais com dashboard ' +
          'em nuvem, alertas preditivos e relatórios automáticos para editais FINEP.',
        planoDeAcao: [
          'Definir arquitetura dos sensores (temperatura, pressão, pH)',
          'Desenvolver firmware embarcado em ESP32 com MQTT',
          'Criar API de ingestão de dados em tempo real (Next.js + PostgreSQL)',
          'Implementar dashboard de monitoramento com alertas por WhatsApp',
          'Validar protótipo em parceria com cooperativa agricola local',
          'Documentar TRL 4 → 6 para submissão ao edital',
        ],
        sugestoesDePesquisa: [
          'Biodigestores de alta eficiência para resíduos agroindustriais',
          'Protocolos MQTT e LoRaWAN para IoT rural de baixo consumo',
          'Análise de viabilidade econômica de biogás para geração distribuída',
          'Casos de sucesso do Programa Bionergia da FINEP 2022-2025',
        ],
      });
    }

    // ── Passo 1: Transcrição com Whisper ────────────────────────
    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'audio.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', 'pt');
    whisperForm.append('response_format', 'text');

    const whisperRes = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: whisperForm,
      },
    );

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      console.error('[Brainstorm Whisper]', err);
      return NextResponse.json(
        { error: 'Falha na transcrição do áudio.' },
        { status: 502 },
      );
    }

    const transcricao = (await whisperRes.text()).trim();

    // ── Passo 2: Estruturação com GPT-4o via AI SDK ────────────
    const systemPrompt = `Você é um especialista em inovação e editais de fomento brasileiros (FINEP, CNPq, BNDES).
Ao receber uma transcrição de brainstorm, extraia as informações principais.
Seja objetivo, técnico e use vocabulário adequado para propostas de P&D.`;

    try {
      const { object: structured } = await generateObject({
        model: gpt('gpt-4o'),
        schema: BrainstormOutputSchema,
        system: systemPrompt,
        prompt: `Transcrição do brainstorm:\n\n"${transcricao}"`,
        temperature: 0.4,
      });

      return NextResponse.json({
        transcricao,
        resumo: structured.resumo,
        planoDeAcao: structured.planoDeAcao,
        sugestoesDePesquisa: structured.sugestoesDePesquisa,
      });
    } catch (err) {
      console.error('[Brainstorm GPT-4o]', err);
      // Retorna a transcrição mesmo sem a estruturação
      return NextResponse.json({
        transcricao,
        resumo: transcricao.slice(0, 200),
        planoDeAcao: [],
        sugestoesDePesquisa: [],
      });
    }
  } catch (error) {
    console.error('[API /brainstorm]', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
