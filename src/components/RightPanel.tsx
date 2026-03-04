'use client';

import { useState } from 'react';
import { ThermometerSun, MessageCircle, Sparkles, HeartPulse } from 'lucide-react';
import ProposalHealthRadar from './ProposalHealthRadar';

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<'ia' | 'saude'>('ia');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Como posso ajudar na sua tese hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /* Scores estáticos — reatividade virá depois */
  const staticScores = {
    Técnico: 82,
    Financeiro: 68,
    Impacto: 91,
    Equipe: 75,
    Sustentabilidade: 60,
    Inovação: 88,
    Risco: 55,
  } as const;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Simulação de IA (depois conectamos com Gemini)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Entendi! Sua tese tem boa aderência ao edital. Quer que eu gere o Risco Tecnológico em 5 pilares agora?'
      }]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="w-96 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full">

      {/* ── Tab bar ── */}
      <div className="flex border-b border-zinc-800 shrink-0">
        <button
          onClick={() => setActiveTab('ia')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
            ${activeTab === 'ia'
              ? 'text-violet-400 border-b-2 border-violet-500'
              : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Sparkles size={15} />
          IA
        </button>
        <button
          onClick={() => setActiveTab('saude')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
            ${activeTab === 'saude'
              ? 'text-violet-400 border-b-2 border-violet-500'
              : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <HeartPulse size={15} />
          Saúde
        </button>
      </div>

      {/* ── Aba: Saúde ── */}
      {activeTab === 'saude' && (
        <div className="flex-1 overflow-y-auto p-4">
          <ProposalHealthRadar scores={staticScores} />
        </div>
      )}

      {/* ── Aba: IA ── */}
      {activeTab === 'ia' && (
        <>
          {/* Termômetro */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <ThermometerSun className="text-orange-400" size={24} />
              <h3 className="font-semibold">Termômetro de Aderência</h3>
            </div>
            <div className="text-7xl font-bold text-emerald-400">87</div>
            <p className="text-sm text-zinc-400 mt-1">Excelente aderência ao edital</p>
          </div>

          {/* Botões rápidos de IA */}
          <div className="p-6 border-b border-zinc-800 grid grid-cols-2 gap-3">
            <button className="bg-zinc-900 hover:bg-violet-900/30 border border-zinc-700 rounded-2xl p-4 text-left transition">
              <Sparkles className="text-violet-400 mb-2" size={20} />
              <div className="font-medium text-sm">Risco 5 Pilares</div>
            </button>
            <button className="bg-zinc-900 hover:bg-violet-900/30 border border-zinc-700 rounded-2xl p-4 text-left transition">
              <Sparkles className="text-violet-400 mb-2" size={20} />
              <div className="font-medium text-sm">Humanizar texto</div>
            </button>
          </div>

          {/* Chat IA */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
              <MessageCircle size={22} />
              <h3 className="font-semibold">Consultor Técnico</h3>
            </div>

            <div className="flex-1 p-6 overflow-auto space-y-6 text-sm">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-violet-600' : 'bg-zinc-900'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-zinc-500">Pensando...</div>}
            </div>

            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Pergunte algo sobre o edital..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-violet-600 hover:bg-violet-700 px-6 rounded-2xl"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
