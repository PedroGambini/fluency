'use client';

import { useEffect } from 'react';
import { useStore, getUniqueWordsCount } from '@/lib/store';
import { getProgressPercent } from '@/lib/levels';
import { ACHIEVEMENTS, checkAllAchievements } from '@/lib/achievements';
import AchievementBadge from './AchievementBadge';
import confetti from 'canvas-confetti';

interface SummaryModalProps {
  sessionSeconds: number;
  onContinue: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function SummaryModal({ sessionSeconds, onContinue }: SummaryModalProps) {
  const store = useStore();
  const { user, vocabulary, achievements, currentSession, unlockAchievement, completeConversation, incrementTime } = store;

  useEffect(() => {
    completeConversation();
    incrementTime(sessionSeconds);

    const newlyUnlocked = checkAllAchievements(store, achievements);
    newlyUnlocked.forEach(unlockAchievement);

    if (newlyUnlocked.length > 0) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const uniqueCount = getUniqueWordsCount(vocabulary);
  const progress = getProgressPercent(uniqueCount, user.level);
  const newWords = currentSession.newWordsThisSession;

  const newlyUnlocked = checkAllAchievements(
    { ...store, stats: { ...store.stats, conversationsCompleted: store.stats.conversationsCompleted + 1 } },
    achievements
  );

  return (
    <div className="absolute inset-0 z-40 bg-black/50 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-6 space-y-5 max-h-[85%] overflow-y-auto">
        <div className="text-center">
          <div className="text-3xl mb-1">🎊</div>
          <h2 className="text-xl font-extrabold text-gray-800">Sessão concluída!</h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-2xl p-3 text-center">
            <div className="text-lg font-bold text-[#58CC02]">{formatTime(sessionSeconds)}</div>
            <div className="text-xs text-gray-500">⏱️ Tempo</div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 text-center">
            <div className="text-lg font-bold text-blue-600">{newWords.length}</div>
            <div className="text-xs text-gray-500">🆕 Novas</div>
          </div>
          <div className="bg-purple-50 rounded-2xl p-3 text-center">
            <div className="text-lg font-bold text-purple-600">{uniqueCount}</div>
            <div className="text-xs text-gray-500">📚 Total</div>
          </div>
        </div>

        {/* New words */}
        {newWords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">PALAVRAS NOVAS</p>
            <div className="flex flex-wrap gap-1">
              {newWords.map((w) => (
                <span key={w} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Nível {user.level}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#58CC02] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Achievements */}
        {newlyUnlocked.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">🏆 CONQUISTAS DESBLOQUEADAS</p>
            <div className="grid grid-cols-3 gap-2">
              {newlyUnlocked.map((id) => {
                const a = ACHIEVEMENTS.find((x) => x.id === id)!;
                return <AchievementBadge key={id} achievement={a} unlocked />;
              })}
            </div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full py-4 bg-[#58CC02] text-white font-extrabold rounded-2xl hover:bg-[#4caf00] transition-colors"
        >
          Continuar praticando →
        </button>
      </div>
    </div>
  );
}
