import { create } from 'zustand';
import { CEFRLevel, LEVELS, STOPWORDS, shouldLevelUp } from './levels';

export interface WordEntry {
  count: number;
  firstUsed: number;
  cefrLevel: CEFRLevel;
}

export interface SessionState {
  user: {
    name: string;
    level: CEFRLevel;
    goal: string;
    nativeLanguage: 'pt';
    targetLanguage: 'en';
  } | null;

  vocabulary: Record<string, WordEntry>;

  stats: {
    totalPracticeSeconds: number;
    conversationsCompleted: number;
  };

  achievements: string[];

  currentSession: {
    scenarioId: string | null;
    chosenDifficulty: CEFRLevel | null;
    startedAt: number | null;
    messages: { role: 'user' | 'assistant'; content: string }[];
    newWordsThisSession: string[];
    messageCount: number;
    usedPortugueseThisSession: boolean;
    scenariosVisited: string[];
    sessionEnded: boolean;
  };

  levelUpPending: CEFRLevel | null;
}

interface StoreActions {
  setUser: (user: NonNullable<SessionState['user']>) => void;
  clearUser: () => void;
  addWords: (words: string[]) => void;
  incrementTime: (seconds: number) => void;
  completeConversation: () => void;
  unlockAchievement: (id: string) => void;
  setScenario: (scenarioId: string, difficulty: CEFRLevel) => void;
  addMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  markUsedPortuguese: () => void;
  clearLevelUp: () => void;
  endSession: () => void;
  resetSession: () => void;
}

const initialCurrentSession: SessionState['currentSession'] = {
  scenarioId: null,
  chosenDifficulty: null,
  startedAt: null,
  messages: [],
  newWordsThisSession: [],
  messageCount: 0,
  usedPortugueseThisSession: false,
  scenariosVisited: [],
  sessionEnded: false,
};

export const useStore = create<SessionState & StoreActions>((set) => ({
  user: null,
  vocabulary: {},
  stats: { totalPracticeSeconds: 0, conversationsCompleted: 0 },
  achievements: [],
  currentSession: { ...initialCurrentSession },
  levelUpPending: null,

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),

  addWords: (words) =>
    set((state) => {
      if (!state.user) return {};
      const vocab = { ...state.vocabulary };
      const newWords: string[] = [];

      for (const raw of words) {
        const word = raw.toLowerCase().replace(/[^a-z']/g, '').trim();
        if (!word || STOPWORDS.has(word) || word.length < 2) continue;

        if (vocab[word]) {
          vocab[word] = { ...vocab[word], count: vocab[word].count + 1 };
        } else {
          vocab[word] = { count: 1, firstUsed: Date.now(), cefrLevel: state.user!.level };
          newWords.push(word);
        }
      }

      const uniqueCount = Object.keys(vocab).length;
      let newLevel = state.user!.level;
      let levelUpPending: CEFRLevel | null = null;

      if (shouldLevelUp(uniqueCount, state.user!.level)) {
        newLevel = LEVELS[state.user!.level].next!;
        levelUpPending = newLevel;
      }

      return {
        vocabulary: vocab,
        levelUpPending,
        user: newLevel !== state.user!.level ? { ...state.user!, level: newLevel } : state.user,
        currentSession: {
          ...state.currentSession,
          newWordsThisSession: [...state.currentSession.newWordsThisSession, ...newWords],
        },
      };
    }),

  incrementTime: (seconds) =>
    set((state) => ({
      stats: {
        ...state.stats,
        totalPracticeSeconds: state.stats.totalPracticeSeconds + seconds,
      },
    })),

  completeConversation: () =>
    set((state) => ({
      stats: {
        ...state.stats,
        conversationsCompleted: state.stats.conversationsCompleted + 1,
      },
    })),

  unlockAchievement: (id) =>
    set((state) => ({
      achievements: state.achievements.includes(id)
        ? state.achievements
        : [...state.achievements, id],
    })),

  setScenario: (scenarioId, difficulty) =>
    set((state) => ({
      currentSession: {
        ...initialCurrentSession,
        scenarioId,
        chosenDifficulty: difficulty,
        startedAt: Date.now(),
        scenariosVisited: state.currentSession.scenariosVisited.includes(scenarioId)
          ? state.currentSession.scenariosVisited
          : [...state.currentSession.scenariosVisited, scenarioId],
      },
    })),

  addMessage: (message) =>
    set((state) => ({
      currentSession: {
        ...state.currentSession,
        messages: [...state.currentSession.messages, message],
        messageCount: state.currentSession.messageCount + 1,
      },
    })),

  markUsedPortuguese: () =>
    set((state) => ({
      currentSession: { ...state.currentSession, usedPortugueseThisSession: true },
    })),

  clearLevelUp: () => set({ levelUpPending: null }),

  endSession: () =>
    set((state) => ({
      currentSession: { ...state.currentSession, sessionEnded: true },
    })),

  resetSession: () =>
    set((state) => ({
      currentSession: {
        ...initialCurrentSession,
        scenariosVisited: state.currentSession.scenariosVisited,
      },
    })),
}));

export function getUniqueWordsCount(vocabulary: Record<string, WordEntry>): number {
  return Object.keys(vocabulary).length;
}
