'use client';

import { useEffect } from 'react';
import { CEFRLevel } from '@/lib/levels';
import LevelBadge from './LevelBadge';
import confetti from 'canvas-confetti';

interface LevelUpOverlayProps {
  newLevel: CEFRLevel;
  onDismiss: () => void;
}

export default function LevelUpOverlay({ newLevel, onDismiss }: LevelUpOverlayProps) {
  useEffect(() => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 cursor-pointer"
      onClick={onDismiss}
    >
      <div className="level-up-animation flex flex-col items-center gap-4 bg-white rounded-3xl p-8 mx-6 shadow-2xl">
        <div className="text-5xl">🎉</div>
        <div className="text-2xl font-extrabold text-gray-800">Level Up!</div>
        <LevelBadge level={newLevel} size="lg" />
        <p className="text-sm text-gray-500 text-center">
          Você chegou ao nível <strong>{newLevel}</strong>!
        </p>
      </div>
    </div>
  );
}
