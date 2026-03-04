'use client';

import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  TextNode,
  type LexicalEditor,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Table,
  Quote,
  Sparkles,
  SeparatorHorizontal,
  Cpu,
  ClipboardList,
  DollarSign,
  Mic,
  GitBranch,
  BrainCircuit,
  Zap,
} from 'lucide-react';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  INSERT_TRL_WIDGET_COMMAND,
  INSERT_EDITAL_CHECKLIST_COMMAND,
  INSERT_COST_TABLE_COMMAND,
  INSERT_BRAINSTORM_COMMAND,
  INSERT_MERMAID_COMMAND,
  INSERT_DEBATE_CONSENSUS_COMMAND,
  INSERT_INNOVATION_VALIDATOR_COMMAND,
} from './CustomNodes';

// ── Definição dos itens do menu ────────────────────────────────
interface SlashCommandDef {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  onSelect: (editor: LexicalEditor) => void;
}

const SLASH_COMMANDS: SlashCommandDef[] = [
  {
    key: 'h1',
    label: 'Título 1',
    description: 'Seção principal do documento',
    icon: <Heading1 size={16} />,
    keywords: ['titulo', 'heading', 'h1', 'grande'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createHeadingNode('h1');
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'h2',
    label: 'Título 2',
    description: 'Subseção ou capítulo',
    icon: <Heading2 size={16} />,
    keywords: ['titulo', 'heading', 'h2', 'medio'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createHeadingNode('h2');
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'h3',
    label: 'Título 3',
    description: 'Subtítulo de seção',
    icon: <Heading3 size={16} />,
    keywords: ['titulo', 'heading', 'h3', 'pequeno'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createHeadingNode('h3');
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'bullet',
    label: 'Lista com Marcadores',
    description: 'Lista de tópicos não ordenada',
    icon: <List size={16} />,
    keywords: ['lista', 'bullet', 'topicos', 'ul'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    },
  },
  {
    key: 'numbered',
    label: 'Lista Numerada',
    description: 'Lista sequencial ordenada',
    icon: <ListOrdered size={16} />,
    keywords: ['lista', 'numerada', 'ol', 'sequencia'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    },
  },
  {
    key: 'checklist',
    label: 'Lista de Tarefas',
    description: 'Itens com checkbox para marcar',
    icon: <ListChecks size={16} />,
    keywords: ['checklist', 'tarefas', 'check', 'todo'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    },
  },
  {
    key: 'table',
    label: 'Tabela',
    description: 'Tabela estruturada 3×3',
    icon: <Table size={16} />,
    keywords: ['tabela', 'table', 'dados', 'matriz', 'edital'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' });
    },
  },
  {
    key: 'quote',
    label: 'Citação',
    description: 'Bloco de citação ou referência',
    icon: <Quote size={16} />,
    keywords: ['citacao', 'quote', 'referencia', 'blockquote'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createQuoteNode();
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'divider',
    label: 'Divisor',
    description: 'Linha horizontal separadora',
    icon: <SeparatorHorizontal size={16} />,
    keywords: ['divisor', 'linha', 'separador', 'hr', 'divider'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const hrNode = $createHorizontalRuleNode();
          const paragraph = $createParagraphNode();
          selection.insertNodes([hrNode, paragraph]);
        }
      });
    },
  },
  {
    key: 'ai',
    label: 'Chamada para IA',
    description: 'Gerar conteúdo com Inteligência Artificial',
    icon: <Sparkles size={16} className="text-violet-400" />,
    keywords: ['ia', 'ai', 'gerar', 'inteligencia', 'copilot', 'notepress'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const paragraph = $createParagraphNode();
          selection.insertNodes([paragraph]);
        }
      });
      // Dispara evento customizado para o painel de IA abrir
      window.dispatchEvent(new CustomEvent('notepress:ai-call'));
    },
  },
  // ── Widgets Reativos ────────────────────────────────────
  {
    key: 'trl',
    label: 'Widget TRL',
    description: 'Slider de nível TRL 1–9 no corpo do texto',
    icon: <Cpu size={16} className="text-indigo-400" />,
    keywords: ['trl', 'tecnologia', 'maturidade', 'nivel', 'slider', 'widget'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_TRL_WIDGET_COMMAND, { trl: 1 });
    },
  },
  {
    key: 'checklist',
    label: 'Checklist de Edital',
    description: 'Bloco de documentos vinculado ao edital',
    icon: <ClipboardList size={16} className="text-emerald-400" />,
    keywords: ['checklist', 'documentos', 'edital', 'lista', 'verificacao'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_EDITAL_CHECKLIST_COMMAND, {});
    },
  },
  {
    key: 'cost-table',
    label: 'Tabela de Custos',
    description: 'Tabela orçamentária com validação por IA',
    icon: <DollarSign size={16} className="text-amber-400" />,
    keywords: ['custos', 'orcamento', 'tabela', 'financeiro', 'verba', 'valor'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_COST_TABLE_COMMAND, {});
    },
  },
  {
    key: 'brainstorm',
    label: 'Brainstorm por Voz',
    description: 'Grave uma ideia e a IA estrutura automaticamente',
    icon: <Mic size={16} className="text-rose-400" />,
    keywords: ['brainstorm', 'audio', 'voz', 'gravar', 'ideia', 'ia', 'microfone'],
    onSelect: (editor) => {
      // Insere o nó em modo loading; a gravação é iniciada pelo botão na topbar
      editor.dispatchCommand(INSERT_BRAINSTORM_COMMAND, { isLoading: false });
      // Sinaliza para o BrainstormRecordButton iniciar a gravação
      window.dispatchEvent(new CustomEvent('notepress:brainstorm-start'));
    },
  },
  {
    key: 'diagrama',
    label: 'Diagrama Mermaid',
    description: 'Insere um diagrama de fluxo, sequência ou er interativo',
    icon: <GitBranch size={16} className="text-violet-400" />,
    keywords: ['diagrama', 'mermaid', 'fluxo', 'flowchart', 'sequencia', 'er', 'grafico', 'uml'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_MERMAID_COMMAND, {});
    },
  },
  {
    key: 'consenso',
    label: 'Consenso Quadripartite',
    description: 'Bloco de consenso gerado pelo pipeline de IA Quadripartite',
    icon: <BrainCircuit size={16} className="text-violet-400" />,
    keywords: ['consenso', 'quadripartite', 'ia', 'debate', 'analise', 'confianca', 'resultado'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_DEBATE_CONSENSUS_COMMAND, {
        consensus: '',
        confidence: 0,
        roundId: '',
      });
    },
  },
  {
    key: 'validar',
    label: 'Validador de Inovação',
    description: 'Score 0–100 com busca de patentes Lens.org e SerpApi',
    icon: <Zap size={16} className="text-emerald-400" />,
    keywords: ['validar', 'inovacao', 'patente', 'score', 'lens', 'radical', 'disruptiva', 'incremental'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_INNOVATION_VALIDATOR_COMMAND, { isLoading: false });
    },
  },
];

// ── MenuOption do Lexical ──────────────────────────────────────
class SlashMenuOption extends MenuOption {
  readonly def: SlashCommandDef;

  constructor(def: SlashCommandDef) {
    super(def.key);
    this.def = def;
  }
}

// ── Item de menu individual ────────────────────────────────────
function SlashMenuItem({
  command,
  setRefElement,
  isSelected,
  onMouseEnter,
  onClick,
}: {
  command: SlashCommandDef;
  setRefElement: (element: HTMLElement | null) => void;
  isSelected: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <li
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      className={`slash-menu-item${isSelected ? ' slash-menu-item--active' : ''}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      ref={(element) => setRefElement(element)}
    >
      <span className="slash-menu-item__icon">{command.icon}</span>
      <span className="slash-menu-item__text">
        <span className="slash-menu-item__label">{command.label}</span>
        <span className="slash-menu-item__desc">{command.description}</span>
      </span>
    </li>
  );
}

// ── Plugin principal ───────────────────────────────────────────
export default function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // Dispara ao digitar /
  const checkForSlashTrigger = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  // Filtra e ordena as opções conforme o texto após /
  const options = useMemo<SlashMenuOption[]>(() => {
    const query = queryString?.toLowerCase().trim() ?? '';
    return SLASH_COMMANDS.filter(
      (cmd) =>
        !query ||
        cmd.label.toLowerCase().includes(query) ||
        cmd.keywords.some((kw) => kw.includes(query)),
    ).map((cmd) => new SlashMenuOption(cmd));
  }, [queryString]);

  const onSelectOption = useCallback(
    (
      selectedOption: SlashMenuOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      _matchingString: string,
    ) => {
      editor.update(() => {
        // Remove o texto da query (ex.: "/tabela")
        if (nodeToRemove) {
          nodeToRemove.remove();
        }
      });
      // Executa o comando do bloco selecionado
      selectedOption.def.onSelect(editor);
      closeMenu();
    },
    [editor],
  );

  if (options.length === 0 && queryString !== null) return null;

  return (
    <LexicalTypeaheadMenuPlugin<SlashMenuOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForSlashTrigger}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || options.length === 0) return null;

        return createPortal(
          <div className="slash-menu-portal">
            <div className="slash-menu">
              {/* Cabeçalho */}
              <div className="slash-menu__header">
                <Sparkles size={12} className="text-violet-400" />
                <span>Blocos</span>
              </div>

              {/* Lista de opções */}
              <ul
                ref={menuRef}
                role="listbox"
                className="slash-menu__list"
              >
                {options.map((option, index) => (
                  <SlashMenuItem
                    key={option.key}
                    command={option.def}
                    setRefElement={option.setRefElement}
                    isSelected={selectedIndex === index}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectOptionAndCleanUp(option)}
                  />
                ))}
              </ul>

              {/* Rodapé dica */}
              <div className="slash-menu__footer">
                <kbd>↑↓</kbd> navegar &nbsp;·&nbsp; <kbd>Enter</kbd> inserir &nbsp;·&nbsp; <kbd>Esc</kbd> fechar
              </div>
            </div>
          </div>,
          anchorElementRef.current,
        );
      }}
    />
  );
}
