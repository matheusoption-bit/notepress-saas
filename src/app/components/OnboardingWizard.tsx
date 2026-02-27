'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

const questions = [
  {
    id: 1,
    question: "Qual é o seu perfil principal?",
    options: ["Fundador de startup", "Pesquisador / Doutorando", "ICT / Universidade", "Consultor de inovação", "Outra"]
  },
  {
    id: 2,
    question: "Qual sua maior dor hoje?",
    options: ["Perder prazos de editais", "Escrever propostas e pitchs", "Montar apresentações", "Gerenciar tarefas da equipe", "Outra"]
  },
  {
    id: 3,
    question: "Qual o ticket médio dos seus projetos?",
    options: ["Até R$ 500 mil", "R$ 500 mil – R$ 2 milhões", "Acima de R$ 2 milhões"]
  },
  {
    id: 4,
    question: "Quantas pessoas trabalham com você?",
    options: ["Só eu", "2–10 pessoas", "11–50 pessoas", "Mais de 50"]
  },
  {
    id: 5,
    question: "Quais temas você mais trabalha?",
    options: ["Energia / Sustentabilidade", "Saúde / Bio", "Defesa / Segurança", "Agro / Foodtech", "IA / Tecnologia", "Outro"]
  },
  {
    id: 6,
    question: "Qual tom você prefere na IA?",
    options: ["Técnico e direto", "Executivo e estratégico", "Descontraído e motivador"]
  }
];

export default function OnboardingWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleSelect = (answer: string) => {
    setAnswers({ ...answers, [questions[step].id]: answer });
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Finalizar onboarding (aqui vamos salvar no futuro)
      console.log("Onboarding finalizado:", answers);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-lg p-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Vamos configurar sua experiência</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">×</button>
        </div>

        <div className="mb-8">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-600 transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
          </div>
          <p className="text-sm text-zinc-400 mt-2">Pergunta {step + 1} de {questions.length}</p>
        </div>

        <h3 className="text-2xl font-semibold mb-8">{questions[step].question}</h3>

        <div className="space-y-3">
          {questions[step].options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              className="w-full text-left p-5 bg-zinc-800 hover:bg-violet-900/30 rounded-2xl transition text-lg border border-transparent hover:border-violet-600"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
