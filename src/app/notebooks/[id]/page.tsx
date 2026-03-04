'use client';

/**
 * NotebookPage — Página do editor de cadernos do Notepress.
 *
 * Layout 3 colunas:
 *   [SourcesSidebar] | [LexicalEditor — canvas central] | [RightPanel]
 *
 * Recursos:
 *   • Modo Zen: ao digitar, as sidebars reduzem opacidade para 0.07 (CSS transition).
 *     Retornam após 2.5s de inatividade ou hover sobre elas.
 *   • Modo Zen Full: botão que oculta sidebars completamente para foco máximo.
 *   • Auto-save: gerenciado pelo hook useDocumentAutoSave via LexicalEditor (debounce 2s).
 *     Status propagado via onSaveStatusChange e exibido no topbar (padrão Linear/Notion).
 *   • Carrega o estado inicial via GET /api/notebooks/:id (campo `content` do Document).
 */

import {
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  CheckCircle,
  Cloud,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import LexicalEditor, { type SaveStatus } from '@/components/editor/LexicalEditor';
import { BrainstormRecordButton } from '@/components/editor/AudioRecorderPlugin';
import SourcesSidebar from '@/components/SourcesSidebar';
import RightPanel from '@/components/RightPanel';

// ── Tipos ─────────────────────────────────────────────────────
// SaveStatus agora é importado do editor/hook centralizado

// ── Indicador visual de salvamento ────────────────────────────
function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle')   return null;
  if (status === 'saving') return <Loader2 size={14} className="save-indicator save-indicator--saving" />;
  if (status === 'saved')  return <CheckCircle size={14} className="save-indicator save-indicator--saved" />;
  if (status === 'error')  return <AlertCircle size={14} className="save-indicator save-indicator--error" />;
  return null;
}

// ── Componente principal ───────────────────────────────────────
export default function NotebookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // ── Estado ─────────────────────────────────────────────────
  const [notebookTitle, setNotebookTitle] = useState<string>('Carregando…');
  const [initialState, setInitialState]   = useState<string | null>(null);  const [editalId, setEditalId]           = useState<string | null>(null);  const [saveStatus, setSaveStatus]       = useState<SaveStatus>('idle');
  const [zenMode, setZenMode]             = useState(false);
  const [fullZen, setFullZen]             = useState(() => {
    // Restaura preferência salva no localStorage (SSR-safe)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notepress.zenMode') === 'true';
    }
    return false;
  });

  // ── Refs para timers (não causam re-render) ──────────────────
  const zenTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Carrega o notebook ao montar (GET /api/notebooks/:id) ───
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/notebooks/${id}`);
        if (!res.ok) return;
        const data = await res.json() as {
          title: string;
          editalId?: string | null;
          document?: { content: unknown } | null;
        };
        setNotebookTitle(data.title ?? 'Sem título');
        setEditalId(data.editalId ?? null);
        if (data.document?.content) {
          setInitialState(JSON.stringify(data.document.content));
        } else {
          setInitialState(null); // editor abre em branco
        }
      } catch {
        setNotebookTitle('Sem título');
      }
    }
    load();
  }, [id]);

  // ── Callback de status do auto-save (vindo do hook via LexicalEditor) ──
  const handleSaveStatusChange = useCallback(
    (status: SaveStatus) => {
      setSaveStatus(status);
    },
    [],
  );

  // ── Ghost Text: chama POST /api/ai/ghost-text ─────────────
  const handleRequestSuggestion = useCallback(
    async (context: string): Promise<string | null> => {
      try {
        const res = await fetch('/api/ai/ghost-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, ...(editalId ? { editalId } : {}) }),
        });
        if (!res.ok) return null;
        const data = await res.json() as { suggestion?: string };
        return data.suggestion ?? null;
      } catch {
        return null;
      }
    },
    [editalId],
  );

  // ── Zen 2.0: persiste preferência no localStorage ────────────
  useEffect(() => {
    localStorage.setItem('notepress.zenMode', String(fullZen));
  }, [fullZen]);

  // ── Zen 2.0: atalho Ctrl+Shift+Z ────────────────────────
  useEffect(() => {
    function onZenShortcut(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        setFullZen(prev => !prev);
      }
    }
    window.addEventListener('keydown', onZenShortcut);
    return () => window.removeEventListener('keydown', onZenShortcut);
  }, []);

  // ── Modo Zen: ativa ao digitar, desativa após 2.5s de pausa ─
  useEffect(() => {
    // Teclas que representam conteúdo real (ignora só-modificadores)
    const CONTENT_KEYS = /^(Key|Digit|Numpad|Backspace|Delete|Space|Enter|Period|Comma)/;

    function activateZen() {
      setZenMode(true);
      if (zenTimer.current) clearTimeout(zenTimer.current);
      zenTimer.current = setTimeout(() => setZenMode(false), 2500);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (CONTENT_KEYS.test(e.code)) activateZen();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (zenTimer.current)  clearTimeout(zenTimer.current);
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      className="notebook-layout"
      data-zen={zenMode ? 'true' : 'false'}
      data-full-zen={fullZen ? 'true' : 'false'}
    >
      {/* ── LEFT SIDEBAR ──────────────────────────────────── */}
      <aside
        className="notebook-sidebar notebook-sidebar--left"
        onMouseEnter={() => { if (zenMode) setZenMode(false); }}
      >
        <SourcesSidebar />
      </aside>

      {/* ── CANVAS CENTRAL ────────────────────────────────── */}
      <main className="notebook-center">
        {/* Topbar: título + status de save + controles */}
        <header className="notebook-topbar">
          <h1 className="notebook-title">{notebookTitle}</h1>

          <div className="notebook-topbar__actions">
            <span className="notebook-save-label">
              {saveStatus === 'saving' && 'Salvando…'}
              {saveStatus === 'saved'  && 'Salvo'}
              {saveStatus === 'error'  && 'Erro ao salvar'}
            </span>
            <SaveIndicator status={saveStatus} />

            <button
              className={`notebook-topbar__btn${
                fullZen ? ' notebook-topbar__btn--zen-active' : ''
              }`}
              title={fullZen
                ? 'Sair do Modo Zen — Ctrl+Shift+Z'
                : 'Modo Zen 2.0 — imersão total (Ctrl+Shift+Z)'}
              onClick={() => setFullZen(f => !f)}
            >
              {fullZen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <BrainstormRecordButton />

            <button
              className="notebook-topbar__btn"
              title="Sincronizado com Prisma"
            >
              <Cloud size={15} />
            </button>
          </div>
        </header>

        {/* Canvas do LexicalEditor */}
        <div className="notebook-editor-area">
          <LexicalEditor
            namespace={`notebook-${id}`}
            initialState={initialState}
            notebookId={id}
            onSaveStatusChange={handleSaveStatusChange}
            onRequestSuggestion={handleRequestSuggestion}
            autoFocus
          />
        </div>
      </main>

      {/* ── RIGHT SIDEBAR ─────────────────────────────────── */}
      <aside
        className="notebook-sidebar notebook-sidebar--right"
        onMouseEnter={() => { if (zenMode) setZenMode(false); }}
      >
        <RightPanel />
      </aside>
    </div>
  );
}
