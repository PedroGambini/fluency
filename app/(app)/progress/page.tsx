'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, getUniqueWordsCount } from '@/lib/store';
import { getProgressPercent, CEFRLevel, CEFR_ORDER } from '@/lib/levels';
import { ACHIEVEMENTS } from '@/lib/achievements';
import LevelBadge from '@/components/LevelBadge';
import AchievementBadge from '@/components/AchievementBadge';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

type FilterType = 'all' | 'mastered' | CEFRLevel;

export default function ProgressPage() {
  const router = useRouter();
  const { user, vocabulary, stats, achievements } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  if (!user) {
    router.replace('/');
    return null;
  }

  const uniqueCount = getUniqueWordsCount(vocabulary);
  const progress = getProgressPercent(uniqueCount, user.level);

  const allWords = Object.entries(vocabulary).sort(([, a], [, b]) => b.count - a.count);

  const filteredWords = allWords.filter(([word, entry]) => {
    const matchSearch = word.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'mastered' ? entry.count >= 5 :
      entry.cefrLevel === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="h-full flex flex-col bg-[#f7f7f7] overflow-y-auto">
      <div className="px-5 pt-6 pb-3">
        <h2 className="text-xl font-extrabold text-gray-800">Progresso</h2>
      </div>

      {/* Level card */}
      <div className="mx-4 bg-white rounded-3xl p-5 shadow-sm mb-4">
        <div className="flex items-center gap-4 mb-4">
          <LevelBadge level={user.level} size="lg" />
          <div>
            <p className="font-bold text-gray-800">Nível atual</p>
            <p className="text-xs text-gray-500">{uniqueCount} palavras únicas</p>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{user.level}</span>
          <span>{progress}% para o próximo</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#58CC02] rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-4">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-lg font-bold text-[#58CC02]">{formatTime(stats.totalPracticeSeconds)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">⏱️ Tempo total</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-lg font-bold text-blue-500">{stats.conversationsCompleted}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">💬 Conversas</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-lg font-bold text-purple-500">{uniqueCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">📚 Palavras</p>
        </div>
      </div>

      {/* Vocabulary */}
      <div className="mx-4 bg-white rounded-3xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Vocabulário</h3>
          <button
            onClick={() => router.push('/vocabulary')}
            className="text-xs font-bold text-[#58CC02] hover:underline"
          >
            Ver tudo →
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar palavra..."
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#58CC02] focus:outline-none mb-3"
        />

        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {(['all', 'mastered', ...CEFR_ORDER] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-[#58CC02] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'mastered' ? '⭐ Dominadas' : f}
            </button>
          ))}
        </div>

        {filteredWords.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {allWords.length === 0 ? 'Nenhuma palavra ainda. Comece a praticar!' : 'Nenhuma palavra encontrada.'}
          </p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filteredWords.slice(0, 100).map(([word, entry]) => (
              <div key={word} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  {entry.count >= 5 && <span className="mr-1">⭐</span>}
                  {word}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {entry.count}×
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="mx-4 bg-white rounded-3xl p-4 shadow-sm mb-4">
        <h3 className="font-bold text-gray-800 mb-3">Conquistas</h3>
        <div className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge
              key={a.id}
              achievement={a}
              unlocked={achievements.includes(a.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
