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
 *   • Auto-save: debounce de 1500ms no onChange do Lexical → PATCH /api/notebooks/:id.
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
import LexicalEditor from '@/components/editor/LexicalEditor';
import { BrainstormRecordButton } from '@/components/editor/AudioRecorderPlugin';
import SourcesSidebar from '@/components/SourcesSidebar';
import RightPanel from '@/components/RightPanel';

// ── Tipos ─────────────────────────────────────────────────────
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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
  const [initialState, setInitialState]   = useState<string | null>(null);
  const [saveStatus, setSaveStatus]       = useState<SaveStatus>('idle');
  const [zenMode, setZenMode]             = useState(false);
  const [fullZen, setFullZen]             = useState(false);

  // ── Refs para timers (não causam re-render) ──────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zenTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Carrega o notebook ao montar (GET /api/notebooks/:id) ───
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/notebooks/${id}`);
        if (!res.ok) return;
        const data = await res.json() as {
          title: string;
          document?: { content: unknown } | null;
        };
        setNotebookTitle(data.title ?? 'Sem título');
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

  // ── Auto-save: debounce 1500ms → PATCH /api/notebooks/:id ───
  const handleEditorChange = useCallback(
    (json: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus('saving');

      saveTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/notebooks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: JSON.parse(json) }),
          });
          setSaveStatus(res.ok ? 'saved' : 'error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } catch {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 4000);
        }
      }, 1500);
    },
    [id],
  );

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
      if (saveTimer.current) clearTimeout(saveTimer.current);
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
              className="notebook-topbar__btn"
              title={fullZen ? 'Sair do Modo Zen' : 'Modo Zen — foco total'}
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
            onChange={handleEditorChange}
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
