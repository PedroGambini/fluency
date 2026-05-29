import { Achievement } from '@/lib/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
}

export default function AchievementBadge({ achievement, unlocked }: AchievementBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
        unlocked ? 'bg-green-50' : 'bg-gray-100 opacity-50 grayscale'
      }`}
    >
      <span className="text-2xl">{achievement.icon}</span>
      <span className="text-xs font-semibold text-center text-gray-700 leading-tight">
        {achievement.name}
      </span>
    </div>
  );
}
