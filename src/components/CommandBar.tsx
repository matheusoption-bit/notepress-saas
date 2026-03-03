'use client';

/**
 * CommandBar — Command Palette global do Notepress.
 *
 * Usa kbar para fornecer uma paleta de comandos acionada por ⌘K / Ctrl+K.
 * Estilo glassmorphism: backdrop-blur, bg-black/80, border sutil.
 *
 * Estrutura:
 *   <CommandBar>           → KBarProvider (wrapper raiz — vai no layout)
 *     <CommandBarPortal /> → KBarPortal + KBarSearch + KBarResults (portal)
 *   </CommandBar>
 *
 * Para adicionar ações em qualquer sub-árvore, use:
 *   import { useRegisterActions } from 'kbar';
 */

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { forwardRef, useMemo } from 'react';
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarSearch,
  KBarResults,
  useMatches,
  type Action,
  type ActionImpl,
} from 'kbar';
import {
  BookPlus,
  Search,
  SunMoon,
  UserCircle2,
  LayoutDashboard,
  FileText,
  ChevronRight,
} from 'lucide-react';

// ── Tipos auxiliares ───────────────────────────────────────────
type ResultItem = ActionImpl | string;

// ══════════════════════════════════════════════════════════════
// ── CommandBarPortal — o painel flutuante renderizado no body ─
// ══════════════════════════════════════════════════════════════
function CommandBarPortal() {
  return (
    <KBarPortal>
      {/* Overlay escuro */}
      <KBarPositioner
        style={{
          zIndex:          9000,
          background:      'rgba(0, 0, 0, 0.60)',
          backdropFilter:  'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          padding:         '12vh 16px 16px',
        }}
      >
        {/* Painel glassmorphism */}
        <div className="command-bar__panel">
          {/* Caixa de busca */}
          <div className="command-bar__search-wrap">
            <Search
              size={15}
              className="command-bar__search-icon"
              aria-hidden="true"
            />
            <KBarSearch
              className="command-bar__search-input"
              defaultPlaceholder="Buscar ações, páginas, comandos…"
            />
            <kbd className="command-bar__esc-badge">ESC</kbd>
          </div>

          {/* Resultados */}
          <div className="command-bar__results-wrap">
            <RenderResults />
          </div>

          {/* Rodapé com dicas de teclado */}
          <div className="command-bar__footer">
            <span className="command-bar__footer-hint">
              <kbd>↑↓</kbd> navegar
            </span>
            <span className="command-bar__footer-hint">
              <kbd>↵</kbd> selecionar
            </span>
            <span className="command-bar__footer-hint">
              <kbd>ESC</kbd> fechar
            </span>
          </div>
        </div>
      </KBarPositioner>
    </KBarPortal>
  );
}

// ── Lista de resultados ────────────────────────────────────────
function RenderResults() {
  const { results, rootActionId } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          /* Cabeçalho de seção */
          <div className="command-bar__section-label">{item}</div>
        ) : (
          /* Item de ação */
          <ResultRow item={item} active={active} currentRootActionId={rootActionId} />
        )
      }
    />
  );
}

// ── Linha de resultado ─────────────────────────────────────────
interface ResultRowProps {
  item: ActionImpl;
  active: boolean;
  currentRootActionId: string | null | undefined;
}

const ResultRow = forwardRef<HTMLDivElement, ResultRowProps>(
  ({ item, active }, ref) => {
    const ancestors = useMemo(() => {
      if (!item.ancestors) return [];
      return item.ancestors.slice(
        item.ancestors.findIndex((a) => a.id === item.id) + 1,
      );
    }, [item.ancestors, item.id]);

    return (
      <div
        ref={ref}
        className={`command-bar__result${active ? ' command-bar__result--active' : ''}`}
      >
        {/* Ícone */}
        <span className="command-bar__result-icon">
          {item.icon ?? <ChevronRight size={14} />}
        </span>

        {/* Texto */}
        <span className="command-bar__result-text">
          {/* Breadcrumb de ancestrais */}
          {ancestors.length > 0 && (
            <span className="command-bar__result-ancestors">
              {ancestors.map((a) => (
                <span key={a.id}>
                  {a.name}
                  <ChevronRight size={10} className="inline mx-1 opacity-50" />
                </span>
              ))}
            </span>
          )}
          <span className="command-bar__result-name">{item.name}</span>
          {item.subtitle && (
            <span className="command-bar__result-subtitle">{item.subtitle}</span>
          )}
        </span>

        {/* Atalho de teclado */}
        {item.shortcut?.length ? (
          <span className="command-bar__result-shortcuts" aria-hidden="true">
            {item.shortcut.map((key) => (
              <kbd key={key} className="command-bar__kbd">{key}</kbd>
            ))}
          </span>
        ) : null}
      </div>
    );
  },
);
ResultRow.displayName = 'ResultRow';

// ══════════════════════════════════════════════════════════════
// ── Ações iniciais — construídas em runtime (hooks disponíveis)
// ══════════════════════════════════════════════════════════════
function useRootActions(): Action[] {
  const router   = useRouter();
  const { theme, setTheme } = useTheme();

  return useMemo<Action[]>(
    () => [
      // ── Navegação ──────────────────────────────────────────
      {
        id:       'dashboard',
        name:     'Dashboard',
        subtitle: 'Ir para a tela inicial',
        keywords: 'inicio home painel dashboard',
        section:  'Navegação',
        icon:     <LayoutDashboard size={15} />,
        shortcut: [],
        perform:  () => router.push('/dashboard'),
      },
      {
        id:       'new-notebook',
        name:     'Criar Novo Notebook',
        subtitle: 'Abrir editor em branco',
        keywords: 'criar novo notebook documento escrever projeto',
        section:  'Navegação',
        icon:     <BookPlus size={15} />,
        shortcut: ['n'],
        perform:  () => router.push('/notebooks/new'),
      },
      {
        id:       'editais',
        name:     'Buscar Edital',
        subtitle: 'Explorar editais de fomento disponíveis',
        keywords: 'edital buscar pesquisar finep cnpq fapesp fomento',
        section:  'Navegação',
        icon:     <Search size={15} />,
        shortcut: ['e'],
        perform:  () => router.push('/editais'),
      },
      {
        id:       'notebooks',
        name:     'Meus Notebooks',
        subtitle: 'Ver todos os notebooks',
        keywords: 'notebooks lista documentos projetos',
        section:  'Navegação',
        icon:     <FileText size={15} />,
        shortcut: [],
        perform:  () => router.push('/notebooks'),
      },
      {
        id:       'profile',
        name:     'Meu Perfil',
        subtitle: 'Configurações e conta',
        keywords: 'perfil conta settings configuracoes usuario',
        section:  'Conta',
        icon:     <UserCircle2 size={15} />,
        shortcut: [],
        perform:  () => router.push('/settings'),
      },
      // ── Aparência ──────────────────────────────────────────
      {
        id:       'toggle-theme',
        name:     theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro',
        subtitle: `Tema atual: ${theme === 'dark' ? 'escuro' : theme === 'light' ? 'claro' : 'sistema'}`,
        keywords: 'tema escuro claro dark light toggle aparencia',
        section:  'Aparência',
        icon:     <SunMoon size={15} />,
        shortcut: [],
        perform:  () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
    ],
    [router, theme, setTheme],
  );
}

// ══════════════════════════════════════════════════════════════
// ── CommandBar — Provider raiz (envolve o layout inteiro) ─────
// ══════════════════════════════════════════════════════════════

/**
 * Provedor raiz do kbar. Deve ser colocado em volta do layout que usa a
 * paleta de comandos. Renderiza automaticamente o Portal com o painel.
 */
export function CommandBar({ children }: { children: React.ReactNode }) {
  const actions = useRootActions();

  return (
    <KBarProvider
      actions={actions}
      options={{
        // Ativa o atalho padrão ⌘K / Ctrl+K globalmente
        enableHistory: true,
        callbacks: {
          onOpen:  () => document.body.classList.add('kbar-open'),
          onClose: () => document.body.classList.remove('kbar-open'),
        },
      }}
    >
      <CommandBarPortal />
      {children}
    </KBarProvider>
  );
}

// ── Re-export do hook para adicionar ações dinamicamente ──────
export { useRegisterActions } from 'kbar';
export type { Action as KBarAction } from 'kbar';
