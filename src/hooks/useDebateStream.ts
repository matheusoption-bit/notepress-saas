'use client';

/**
 * useDebateStream — Hook para consumir o streaming SSE do Debate Engine.
 *
 * Conecta ao POST /api/ai/quadripartite via EventSource-like fetch
 * e atualiza estado React progressivamente conforme os agentes completam.
 *
 * Eventos SSE recebidos:
 *   round:start  → { round, agents }
 *   agent:done   → { round, agentType, content }
 *   round:done   → { round, messages }
 *   consensus    → { consensus, confidence, mermaidCode }
 *   done         → payload final completo
 *   error        → { message }
 *
 * @example
 * ```tsx
 * const { startDebate, state, rounds, consensus, activeAgents } = useDebateStream();
 *
 * // Inicia um debate
 * startDebate({ notebookId, userPrompt, mode: 'CONSENSUS' });
 *
 * // Renderiza avatares "digitando"
 * activeAgents.map(agent => <AgentAvatar key={agent} typing />)
 *
 * // Renderiza resultados progressivos
 * Object.entries(rounds).map(([round, messages]) => ...)
 * ```
 */

import { useCallback, useRef, useState } from 'react';

// ── Tipos ──────────────────────────────────────────────────────

export type DebateAgentType =
  | 'GEMINI_SEARCH'
  | 'GEMINI_CREATE'
  | 'DEEPSEEK'
  | 'LLAMA'
  | 'WATSONX_BR';

export type DebateStreamState =
  | 'idle'
  | 'connecting'
  | 'round-1'
  | 'round-2'
  | 'round-3'
  | 'consensus'
  | 'done'
  | 'error';

export interface DebateMessage {
  agentType: DebateAgentType;
  content: string;
}

export interface DebateStreamResult {
  roundId: string | null;
  consensus: string | null;
  confidence: number | null;
  mermaidCode: string | null;
  mode: string | null;
  rounds: Record<number, DebateMessage[]>;
  meta: Record<string, unknown> | null;
}

export interface UseDebateStreamReturn {
  /** Inicia um novo debate SSE */
  startDebate: (params: {
    notebookId: string;
    userPrompt: string;
    mode?: string;
    documentId?: string;
    editalId?: string;
  }) => void;
  /** Cancela o debate em andamento */
  cancel: () => void;
  /** Estado atual do streaming */
  state: DebateStreamState;
  /** Agentes atualmente "digitando" (enviaram round:start mas não agent:done) */
  activeAgents: DebateAgentType[];
  /** Resultado progressivo */
  result: DebateStreamResult;
  /** Mensagem de erro, se houver */
  error: string | null;
}

const EMPTY_RESULT: DebateStreamResult = {
  roundId: null,
  consensus: null,
  confidence: null,
  mermaidCode: null,
  mode: null,
  rounds: {},
  meta: null,
};

// ── Hook ───────────────────────────────────────────────────────

export function useDebateStream(): UseDebateStreamReturn {
  const [state, setState] = useState<DebateStreamState>('idle');
  const [activeAgents, setActiveAgents] = useState<DebateAgentType[]>([]);
  const [result, setResult] = useState<DebateStreamResult>(EMPTY_RESULT);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState('idle');
    setActiveAgents([]);
  }, []);

  const startDebate = useCallback(
    (params: {
      notebookId: string;
      userPrompt: string;
      mode?: string;
      documentId?: string;
      editalId?: string;
    }) => {
      // Cancela qualquer debate em andamento
      cancel();

      // Reset state
      setState('connecting');
      setError(null);
      setResult(EMPTY_RESULT);
      setActiveAgents([]);

      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          const res = await fetch('/api/ai/quadripartite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notebookId: params.notebookId,
              userPrompt: params.userPrompt,
              mode: params.mode ?? 'CONSENSUS',
              ...(params.documentId && { documentId: params.documentId }),
              ...(params.editalId && { editalId: params.editalId }),
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }

          if (!res.body) {
            throw new Error('Resposta sem body de streaming.');
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE events from buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? ''; // keep incomplete line in buffer

            let currentEvent = '';
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim();
              } else if (line.startsWith('data: ') && currentEvent) {
                try {
                  const data = JSON.parse(line.slice(6));
                  processEvent(currentEvent, data);
                } catch {
                  // skip malformed data
                }
                currentEvent = '';
              }
            }
          }
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          const msg = err instanceof Error ? err.message : 'Erro no debate.';
          setError(msg);
          setState('error');
        }
      })();

      function processEvent(event: string, data: Record<string, unknown>) {
        switch (event) {
          case 'round:start': {
            const round = data.round as number;
            const roundState = `round-${round}` as DebateStreamState;
            setState(roundState);
            setActiveAgents(data.agents as DebateAgentType[]);
            break;
          }

          case 'agent:done': {
            const agent = data.agentType as DebateAgentType;
            // Remove from active list (no longer "typing")
            setActiveAgents((prev) => prev.filter((a) => a !== agent));
            // Add to partial results
            const round = data.round as number;
            setResult((prev) => ({
              ...prev,
              rounds: {
                ...prev.rounds,
                [round]: [
                  ...(prev.rounds[round] ?? []),
                  { agentType: agent, content: data.content as string },
                ],
              },
            }));
            break;
          }

          case 'round:done': {
            setActiveAgents([]);
            break;
          }

          case 'consensus': {
            setState('consensus');
            setResult((prev) => ({
              ...prev,
              consensus: data.consensus as string,
              confidence: data.confidence as number,
              mermaidCode: (data.mermaidCode as string) ?? null,
            }));
            break;
          }

          case 'done': {
            setState('done');
            setActiveAgents([]);
            setResult((prev) => ({
              ...prev,
              roundId: data.roundId as string,
              mode: data.mode as string,
              meta: data.meta as Record<string, unknown>,
            }));
            break;
          }

          case 'error': {
            setError(data.message as string);
            setState('error');
            break;
          }
        }
      }
    },
    [cancel],
  );

  return {
    startDebate,
    cancel,
    state,
    activeAgents,
    result,
    error,
  };
}
