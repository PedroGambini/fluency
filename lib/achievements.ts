import { SessionState, getUniqueWordsCount } from './store';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  check: (s: SessionState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_chat',
    name: 'Primeira Conversa',
    icon: '🎉',
    description: 'Completou sua primeira conversa',
    check: (s) => s.stats.conversationsCompleted >= 1,
  },
  {
    id: 'chatterbox',
    name: 'Tagarela',
    icon: '💬',
    description: 'Usou 50 palavras únicas',
    check: (s) => getUniqueWordsCount(s.vocabulary) >= 50,
  },
  {
    id: 'word_collector',
    name: 'Colecionador',
    icon: '📚',
    description: 'Usou 200 palavras únicas',
    check: (s) => getUniqueWordsCount(s.vocabulary) >= 200,
  },
  {
    id: 'level_a2',
    name: 'Em Evolução',
    icon: '📈',
    description: 'Chegou ao nível A2',
    check: (s) =>
      s.user !== null &&
      ['A2', 'B1', 'B2', 'C1', 'C2'].includes(s.user.level),
  },
  {
    id: 'level_b1',
    name: 'Independente',
    icon: '🚀',
    description: 'Chegou ao nível B1',
    check: (s) =>
      s.user !== null &&
      ['B1', 'B2', 'C1', 'C2'].includes(s.user.level),
  },
  {
    id: 'five_min',
    name: 'Aquecendo',
    icon: '🔥',
    description: '5 minutos de prática',
    check: (s) => s.stats.totalPracticeSeconds >= 300,
  },
  {
    id: 'marathon',
    name: 'Maratonista',
    icon: '🏃',
    description: '30 minutos de prática',
    check: (s) => s.stats.totalPracticeSeconds >= 1800,
  },
  {
    id: 'english_only',
    name: 'Sem Muletas',
    icon: '🏆',
    description: 'Completou conversa B2+ sem usar português',
    check: (s) =>
      s.user !== null &&
      ['B2', 'C1', 'C2'].includes(s.user.level) &&
      !s.currentSession.usedPortugueseThisSession &&
      s.stats.conversationsCompleted >= 1,
  },
  {
    id: 'explorer',
    name: 'Explorador',
    icon: '🗺️',
    description: 'Experimentou todos os cenários',
    check: (s) => s.currentSession.scenariosVisited.length >= 8,
  },
  {
    id: 'word_master',
    name: 'Mestre',
    icon: '⭐',
    description: '10 palavras dominadas (usadas 5+ vezes)',
    check: (s) =>
      Object.values(s.vocabulary).filter((w) => w.count >= 5).length >= 10,
  },
  {
    id: 'five_conversations',
    name: 'Conversador',
    icon: '🗣️',
    description: 'Completou 5 conversas',
    check: (s) => s.stats.conversationsCompleted >= 5,
  },
  {
    id: 'all_scenarios',
    name: 'Sem Fronteiras',
    icon: '🌎',
    description: 'Experimentou todos os 10 cenários',
    check: (s) => s.currentSession.scenariosVisited.length >= 10,
  },
];

export function checkAllAchievements(
  state: SessionState,
  alreadyUnlocked: string[]
): string[] {
  return ACHIEVEMENTS.filter(
    (a) => !alreadyUnlocked.includes(a.id) && a.check(state)
  ).map((a) => a.id);
}
