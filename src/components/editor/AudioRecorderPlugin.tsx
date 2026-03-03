'use client';

/**
 * AudioRecorderPlugin — Plugin Lexical + Botão de Gravação do Brainstorm.
 *
 * Arquitetura desacoplada via CustomEvent:
 *   1. `BrainstormRecordButton` (pode viver fora do LexicalComposer):
 *      - Gerencia MediaRecorder e estado visual
 *      - Ao parar: POST /api/brainstorm → recebe JSON estruturado
 *      - Dispara `CustomEvent('notepress:brainstorm-result', { detail })` no window
 *
 *   2. `AudioRecorderPlugin` (vive DENTRO do LexicalComposer):
 *      - Escuta `notepress:brainstorm-result`
 *      - Dispara `INSERT_BRAINSTORM_COMMAND` com o payload recebido
 *      - Retorna null (plugin sem UI)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_NORMAL } from 'lexical';
import { Mic, MicOff, Loader2, Square } from 'lucide-react';
import { INSERT_BRAINSTORM_COMMAND, type BrainstormPayload } from './nodes/BrainstormNode';

// ── Tipos do evento customizado ────────────────────────────────
export interface BrainstormResult extends BrainstormPayload {
  error?: string;
}

declare global {
  interface WindowEventMap {
    'notepress:brainstorm-result': CustomEvent<BrainstormResult>;
  }
}

// ── Plugin (dentro do LexicalComposer) ────────────────────────
export default function AudioRecorderPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    function onBrainstormResult(e: CustomEvent<BrainstormResult>) {
      const { error, ...payload } = e.detail;
      if (error) {
        console.error('[AudioRecorderPlugin] Brainstorm error:', error);
        return;
      }
      editor.dispatchCommand(INSERT_BRAINSTORM_COMMAND, payload);
    }

    window.addEventListener('notepress:brainstorm-result', onBrainstormResult);
    return () => {
      window.removeEventListener('notepress:brainstorm-result', onBrainstormResult);
    };
  }, [editor]);

  // Registra o handler do comando (para inserção programática via SlashCommand)
  useEffect(() => {
    return editor.registerCommand(
      INSERT_BRAINSTORM_COMMAND,
      () => false, // deixa o WidgetInsertPlugin tratar
      COMMAND_PRIORITY_NORMAL,
    );
  }, [editor]);

  return null;
}

// ── Hook de gravação (reutilizável) ────────────────────────────
type RecorderState = 'idle' | 'recording' | 'processing' | 'error';

export function useBrainstormRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);

  // Limpa tudo ao desmontar
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        timerRef.current && clearInterval(timerRef.current);
        setElapsedSec(0);
        setState('processing');

        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          const form = new FormData();
          form.append('audio', audioBlob, 'brainstorm.webm');

          const res = await fetch('/api/brainstorm', {
            method: 'POST',
            body: form,
          });

          const data = await res.json() as BrainstormResult;

          window.dispatchEvent(
            new CustomEvent('notepress:brainstorm-result', { detail: data }),
          );
          setState('idle');
        } catch {
          window.dispatchEvent(
            new CustomEvent('notepress:brainstorm-result', {
              detail: { error: 'Falha ao processar o áudio.' },
            }),
          );
          setState('error');
          setTimeout(() => setState('idle'), 3000);
        }
      };

      recorder.start(250); // coleta chunks a cada 250ms
      setState('recording');

      // Timer de exibição
      setElapsedSec(0);
      timerRef.current = setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('[BrainstormRecorder] Microfone negado ou indisponível:', err);
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return { state, elapsedSec, startRecording, stopRecording };
}

// ── Botão de gravação (usa fora do LexicalComposer) ────────────
export function BrainstormRecordButton() {
  const { state, elapsedSec, startRecording, stopRecording } = useBrainstormRecorder();

  function formatTime(sec: number) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  const isRecording   = state === 'recording';
  const isProcessing  = state === 'processing';
  const isError       = state === 'error';

  return (
    <button
      className={[
        'brainstorm-record-btn',
        isRecording   && 'brainstorm-record-btn--recording',
        isProcessing  && 'brainstorm-record-btn--processing',
        isError       && 'brainstorm-record-btn--error',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      title={
        isRecording
          ? 'Clique para parar a gravação'
          : isProcessing
          ? 'Processando…'
          : 'Iniciar Brainstorm por voz'
      }
    >
      {isProcessing ? (
        <>
          <Loader2 size={14} className="brainstorm-record-btn__icon brainstorm-record-btn__spin" />
          <span className="brainstorm-record-btn__label">Processando…</span>
        </>
      ) : isRecording ? (
        <>
          <Square size={14} className="brainstorm-record-btn__icon" />
          <span className="brainstorm-record-btn__label">{formatTime(elapsedSec)}</span>
          <span className="brainstorm-record-btn__pulse" aria-hidden />
        </>
      ) : isError ? (
        <>
          <MicOff size={14} className="brainstorm-record-btn__icon" />
          <span className="brainstorm-record-btn__label">Erro</span>
        </>
      ) : (
        <>
          <Mic size={14} className="brainstorm-record-btn__icon" />
          <span className="brainstorm-record-btn__label">Brainstorm</span>
        </>
      )}
    </button>
  );
}
