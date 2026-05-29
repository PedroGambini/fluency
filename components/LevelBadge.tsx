import { CEFRLevel } from '@/lib/levels';

interface LevelBadgeProps {
  level: CEFRLevel;
  size?: 'sm' | 'lg';
}

const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: 'bg-green-100 text-green-700',
  A2: 'bg-green-200 text-green-800',
  B1: 'bg-blue-100 text-blue-700',
  B2: 'bg-blue-200 text-blue-800',
  C1: 'bg-purple-100 text-purple-700',
  C2: 'bg-purple-200 text-purple-800',
};

export default function LevelBadge({ level, size = 'sm' }: LevelBadgeProps) {
  const color = LEVEL_COLORS[level];
  const sizeClass = size === 'lg'
    ? 'text-2xl font-bold px-4 py-2'
    : 'text-xs font-semibold px-2 py-0.5';

  return (
    <span className={`rounded-full ${color} ${sizeClass} inline-block`}>
      {level}
    </span>
  );
}
