'use client';

import { useState } from 'react';
import { Scenario } from '@/lib/scenarios';
import { CEFRLevel, CEFR_ORDER } from '@/lib/levels';
import LevelBadge from './LevelBadge';
import { X } from 'lucide-react';

interface ScenarioStartModalProps {
  scenario: Scenario;
  defaultDifficulty: CEFRLevel;
  onStart: (difficulty: CEFRLevel) => void;
  onClose: () => void;
}

export default function ScenarioStartModal({
  scenario,
  defaultDifficulty,
  onStart,
  onClose,
}: ScenarioStartModalProps) {
  const [difficulty, setDifficulty] = useState<CEFRLevel>(defaultDifficulty);

  return (
    <div className="absolute inset-0 z-40 bg-black/50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{scenario.icon}</span>
            <div>
              <h3 className="font-extrabold text-gray-800 text-lg">{scenario.name}</h3>
              <LevelBadge level={scenario.suggestedLevel} size="sm" />
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-2xl p-4">
          {scenario.description}
        </p>

        {/* Difficulty picker */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">ESCOLHA SUA DIFICULDADE</p>
          <div className="grid grid-cols-3 gap-2">
            {CEFR_ORDER.map((l) => (
              <button
                key={l}
                onClick={() => setDifficulty(l)}
                className={`py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                  difficulty === l
                    ? 'border-[#58CC02] bg-green-50 text-[#58CC02]'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="bg-green-50 rounded-2xl px-4 py-3">
          <p className="text-xs font-bold text-green-700 mb-0.5">🎯 SUA MISSÃO</p>
          <p className="text-sm text-green-800">{scenario.mission}</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => onStart(difficulty)}
          className="w-full py-4 bg-[#58CC02] text-white font-extrabold text-base rounded-2xl hover:bg-[#4caf00] active:scale-[0.98] transition-all shadow-lg shadow-green-200"
        >
          Começar →
        </button>
      </div>
    </div>
  );
}
