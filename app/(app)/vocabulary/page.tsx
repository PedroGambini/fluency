'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, getUniqueWordsCount } from '@/lib/store';
import { CEFRLevel, CEFR_ORDER, getProgressPercent } from '@/lib/levels';
import LevelBadge from '@/components/LevelBadge';
import { ArrowLeft, Search, ChevronDown } from 'lucide-react';

type SortMode = 'most_used' | 'least_used' | 'alphabetical' | 'recent';
type FilterLevel = 'all' | CEFRLevel;

const SORT_LABELS: Record<SortMode, string> = {
  most_used: 'Mais usadas',
  least_used: 'Menos usadas',
  alphabetical: 'A → Z',
  recent: 'Recentes',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function estimateLevel(count: number, cefrLevel: CEFRLevel): string {
  if (count >= 10) return `${cefrLevel} · Dominada`;
  if (count >= 5)  return `${cefrLevel} · Consolidada`;
  if (count >= 2)  return `${cefrLevel} · Aprendendo`;
  return `${cefrLevel} · Nova`;
}

const STATUS_COLOR: Record<string, string> = {
  'Dominada':    'text-green-600 bg-green-50',
  'Consolidada': 'text-blue-600 bg-blue-50',
  'Aprendendo':  'text-yellow-600 bg-yellow-50',
  'Nova':        'text-gray-500 bg-gray-100',
};

export default function VocabularyPage() {
  const router = useRouter();
  const { user, vocabulary } = useStore();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('most_used');
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);

  if (!user) { router.replace('/'); return null; }

  const allWords = Object.entries(vocabulary);
  const uniqueCount = getUniqueWordsCount(vocabulary);
  const masteredCount = allWords.filter(([, e]) => e.count >= 5).length;
  const progress = getProgressPercent(uniqueCount, user.level);

  const topWord = allWords.reduce<[string, number] | null>((best, [w, e]) => {
    if (!best || e.count > best[1]) return [w, e.count];
    return best;
  }, null);

  const filtered = useMemo(() => {
    let list = allWords;

    if (search.trim()) {
      list = list.filter(([w]) => w.includes(search.toLowerCase().trim()));
    }
    if (filterLevel !== 'all') {
      list = list.filter(([, e]) => e.cefrLevel === filterLevel);
    }

    switch (sort) {
      case 'most_used':    return [...list].sort(([, a], [, b]) => b.count - a.count);
      case 'least_used':   return [...list].sort(([, a], [, b]) => a.count - b.count);
      case 'alphabetical': return [...list].sort(([a], [b]) => a.localeCompare(b));
      case 'recent':       return [...list].sort(([, a], [, b]) => b.firstUsed - a.firstUsed);
    }
  }, [allWords, search, filterLevel, sort]);

  return (
    <div className="h-full flex flex-col bg-[#f7f7f7] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-gray-800">Meu Vocabulário</h2>
          <p className="text-xs text-gray-400">{uniqueCount} palavras únicas</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-extrabold text-[#58CC02]">{uniqueCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">📚 Palavras únicas</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-extrabold text-yellow-500">{masteredCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">⭐ Dominadas (5+ usos)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <LevelBadge level={user.level} size="sm" />
              <p className="text-xs text-gray-500">{progress}% para o próximo</p>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#58CC02] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {topWord && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-base font-extrabold text-purple-600 truncate">{topWord[0]}</p>
              <p className="text-xs text-gray-500 mt-0.5">🏅 Mais usada · {topWord[1]}×</p>
            </div>
          )}
        </div>

        {/* Search + Sort + Filter */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar palavra..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#58CC02] focus:outline-none bg-white"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-gray-300 transition-colors whitespace-nowrap"
              >
                {SORT_LABELS[sort]}
                <ChevronDown size={12} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg z-20 overflow-hidden min-w-[140px]">
                  {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSort(s); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                        sort === s ? 'bg-green-50 text-[#58CC02]' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {SORT_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Level filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', ...CEFR_ORDER] as FilterLevel[]).map((l) => (
              <button
                key={l}
                onClick={() => setFilterLevel(l)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  filterLevel === l
                    ? 'bg-[#58CC02] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {l === 'all' ? 'Todos' : l}
              </button>
            ))}
          </div>
        </div>

        {/* Word count */}
        <p className="text-xs text-gray-400 font-medium">
          {filtered.length} palavra{filtered.length !== 1 ? 's' : ''}
          {search || filterLevel !== 'all' ? ' encontrada' + (filtered.length !== 1 ? 's' : '') : ''}
        </p>

        {/* Word list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-gray-500">
              {uniqueCount === 0
                ? 'Nenhuma palavra ainda.\nComece praticando!'
                : 'Nenhuma palavra encontrada.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {filtered.map(([word, entry], i) => {
              const statusLabel = estimateLevel(entry.count, entry.cefrLevel).split(' · ')[1];
              const statusClass = STATUS_COLOR[statusLabel] ?? 'text-gray-500 bg-gray-100';
              const isLast = i === filtered.length - 1;

              return (
                <div
                  key={word}
                  className={`flex items-center justify-between px-4 py-3 ${
                    !isLast ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">
                        {entry.count >= 5 && <span className="mr-1">⭐</span>}
                        {word}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Desde {formatDate(entry.firstUsed)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}>
                      {statusLabel}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-gray-700">{entry.count}×</p>
                      <LevelBadge level={entry.cefrLevel} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
