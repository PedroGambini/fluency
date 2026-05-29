'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, getUniqueWordsCount } from '@/lib/store';
import LevelBadge from '@/components/LevelBadge';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const FAKE_FRIENDS = [
  { name: 'Ana', level: 'B1', avatar: '👩' },
  { name: 'Carlos', level: 'A2', avatar: '👨' },
  { name: 'Mariana', level: 'B2', avatar: '👩‍💼' },
  { name: 'Pedro', level: 'C1', avatar: '🧑' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, vocabulary, stats, achievements, clearUser, resetSession } = useStore();
  const [showFriends, setShowFriends] = useState(false);

  if (!user) {
    router.replace('/');
    return null;
  }

  const uniqueCount = getUniqueWordsCount(vocabulary);
  const initial = user.name.charAt(0).toUpperCase();

  function handleSignOut() {
    resetSession();
    clearUser();
    router.replace('/');
  }

  return (
    <div className="h-full flex flex-col bg-[#f7f7f7] overflow-y-auto">
      <div className="px-5 pt-6 pb-3">
        <h2 className="text-xl font-extrabold text-gray-800">Perfil</h2>
      </div>

      {/* Avatar card */}
      <div className="mx-4 bg-white rounded-3xl p-5 shadow-sm mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#58CC02] flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0">
          {initial}
        </div>
        <div>
          <p className="text-lg font-extrabold text-gray-800">{user.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <LevelBadge level={user.level} size="sm" />
            <span className="text-xs text-gray-500">· {user.goal}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 bg-white rounded-3xl p-4 shadow-sm mb-4">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">Estatísticas</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">⏱️ Tempo de prática</span>
            <span className="text-sm font-semibold text-gray-700">{formatTime(stats.totalPracticeSeconds)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">💬 Conversas</span>
            <span className="text-sm font-semibold text-gray-700">{stats.conversationsCompleted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">📚 Palavras únicas</span>
            <span className="text-sm font-semibold text-gray-700">{uniqueCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">🏆 Conquistas</span>
            <span className="text-sm font-semibold text-gray-700">{achievements.length}</span>
          </div>
        </div>
      </div>

      {/* Friends button */}
      <div className="mx-4 mb-4">
        <button
          onClick={() => setShowFriends(true)}
          className="w-full py-3 bg-white rounded-2xl border-2 border-[#58CC02] text-[#58CC02] font-bold text-sm hover:bg-green-50 transition-colors shadow-sm"
        >
          👥 Adicionar amigos
        </button>
      </div>

      {/* Sign out */}
      <div className="mx-4 mb-6">
        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-white rounded-2xl border border-gray-200 text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          Sair
        </button>
      </div>

      {/* Friends modal */}
      {showFriends && (
        <div className="absolute inset-0 z-40 bg-black/50 flex items-end" onClick={() => setShowFriends(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-800">Amigos</h3>
              <button onClick={() => setShowFriends(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="bg-yellow-50 rounded-2xl p-3 mb-4 text-center">
              <p className="text-sm text-yellow-700 font-semibold">Em breve!</p>
              <p className="text-xs text-yellow-600">Esta funcionalidade está em desenvolvimento.</p>
            </div>
            <p className="text-xs text-gray-500 mb-3 font-semibold">SUGESTÕES</p>
            {FAKE_FRIENDS.map((f) => (
              <div key={f.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{f.avatar}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{f.name}</p>
                    <p className="text-xs text-gray-400">Nível {f.level}</p>
                  </div>
                </div>
                <button className="text-xs text-[#58CC02] font-bold border border-[#58CC02] px-3 py-1 rounded-full opacity-60 cursor-not-allowed">
                  + Seguir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
