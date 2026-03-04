'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorState } from 'lexical';

// ── Tipos ──────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Interface de persistência — permite trocar entre JSON/REST (atual)
 * e Yjs binário (futuro) sem alterar o hook ou o editor.
 */
export interface DocumentPersistenceAdapter {
  save(notebookId: string, content: string): Promise<void>;
}

/**
 * Adapter padrão: salva o JSON do Lexical via PATCH REST.
 */
export const jsonPatchAdapter: DocumentPersistenceAdapter = {
  async save(notebookId: string, content: string) {
    const res = await fetch(`/api/notebooks/${notebookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
};

// ── Configuração ───────────────────────────────────────────────

interface UseDocumentAutoSaveOptions {
  /** ID do notebook. Se undefined, o auto-save fica desabilitado. */
  notebookId?: string;
  /** Tempo de espera após a última alteração antes de salvar (ms). @default 2000 */
  debounceMs?: number;
  /** Quanto tempo o status "saved" permanece visível antes de voltar a idle (ms). @default 3000 */
  savedDisplayMs?: number;
  /** Adapter de persistência. @default jsonPatchAdapter */
  adapter?: DocumentPersistenceAdapter;
}

interface UseDocumentAutoSaveReturn {
  /** Status atual do salvamento. */
  saveStatus: SaveStatus;
  /**
   * Deve ser chamado pelo OnChangePlugin do Lexical.
   * Armazena o editorState bruto e agenda a serialização + save
   * via debounce, evitando JSON.stringify a cada keystroke.
   */
  handleChange: (editorState: EditorState) => void;
}

// ── Hook ───────────────────────────────────────────────────────

export function useDocumentAutoSave({
  notebookId,
  debounceMs = 2000,
  savedDisplayMs = 3000,
  adapter = jsonPatchAdapter,
}: UseDocumentAutoSaveOptions = {}): UseDocumentAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Ref para o último EditorState bruto (evita serialização por keystroke)
  const latestEditorState = useRef<EditorState | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa timers ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
    };
  }, []);

  // Executa o save de fato (serializa + persiste)
  const doSave = useCallback(async () => {
    const editorState = latestEditorState.current;
    if (!notebookId || !editorState) return;

    // Serializa APENAS quando o debounce disparar
    const json = JSON.stringify(editorState.toJSON());

    setSaveStatus('saving');
    try {
      await adapter.save(notebookId, json);
      setSaveStatus('saved');
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(
        () => setSaveStatus('idle'),
        savedDisplayMs,
      );
    } catch (err) {
      console.error('[useDocumentAutoSave] falhou:', err);
      setSaveStatus('error');
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(
        () => setSaveStatus('idle'),
        savedDisplayMs + 1000,
      );
    }
  }, [notebookId, adapter, savedDisplayMs]);

  // Chamado pelo OnChangePlugin a cada alteração
  const handleChange = useCallback(
    (editorState: EditorState) => {
      // Armazena o estado bruto sem serializar
      latestEditorState.current = editorState;

      if (!notebookId) return;

      // Reseta debounce. NÃO altera saveStatus aqui (corrige o bug do "saving" prematuro).
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      debounceTimer.current = setTimeout(() => {
        void doSave();
      }, debounceMs);
    },
    [notebookId, debounceMs, doSave],
  );

  return { saveStatus, handleChange };
}
