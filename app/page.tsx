'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CEFRLevel, LEVEL_DESCRIPTIONS, CEFR_ORDER } from '@/lib/levels';
import PhoneFrame from '@/components/PhoneFrame';

const GOALS = ['Viajar', 'Trabalho', 'Conversar', 'Estudar', 'Morar fora'];

export default function EntryPage() {
  const router = useRouter();
  const setUser = useStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [level, setLevel] = useState<CEFRLevel | null>(null);
  const [goal, setGoal] = useState('');

  const canStart = name.trim().length > 0 && level !== null && goal !== '';

  function handleStart() {
    if (!canStart || !level) return;
    setUser({ name: name.trim(), level, goal, nativeLanguage: 'pt', targetLanguage: 'en' });
    router.push('/practice');
  }

  return (
    <PhoneFrame>
      <div className="h-full flex flex-col items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="text-5xl">🌍</div>
            <h1 className="text-4xl font-extrabold text-[#58CC02]">Fluency</h1>
            <p className="text-gray-500 text-sm">Aprenda inglês conversando com IA</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Como você se chama?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#58CC02] focus:outline-none text-gray-800 font-medium transition-colors"
              maxLength={40}
            />
          </div>

          {/* Level */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Qual seu nível de inglês?</label>
            <div className="grid grid-cols-2 gap-2">
              {CEFR_ORDER.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-3 py-3 rounded-2xl border-2 text-left transition-all ${
                    level === l
                      ? 'border-[#58CC02] bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-gray-800">{l}</div>
                  <div className="text-xs text-gray-500 leading-tight mt-0.5">
                    {LEVEL_DESCRIPTIONS[l]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Qual seu objetivo?</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                    goal === g
                      ? 'border-[#58CC02] bg-[#58CC02] text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full py-4 rounded-2xl font-extrabold text-lg transition-all ${
              canStart
                ? 'bg-[#58CC02] text-white hover:bg-[#4caf00] active:scale-[0.98] shadow-lg shadow-green-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Começar →
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
