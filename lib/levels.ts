export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const LEVELS: Record<CEFRLevel, { threshold: number; next: CEFRLevel | null; ptRatio: number }> = {
  A1: { threshold: 0,    next: 'A2', ptRatio: 0.8 },
  A2: { threshold: 80,   next: 'B1', ptRatio: 0.6 },
  B1: { threshold: 200,  next: 'B2', ptRatio: 0.3 },
  B2: { threshold: 400,  next: 'C1', ptRatio: 0.1 },
  C1: { threshold: 700,  next: 'C2', ptRatio: 0.0 },
  C2: { threshold: 1100, next: null,  ptRatio: 0.0 },
} as const;

export const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function getNextLevel(current: CEFRLevel): CEFRLevel | null {
  return LEVELS[current].next;
}

export function getProgressPercent(uniqueWords: number, current: CEFRLevel): number {
  const { threshold } = LEVELS[current];
  const next = LEVELS[current].next;
  if (!next) return 100;
  const nextThreshold = LEVELS[next].threshold;
  const range = nextThreshold - threshold;
  const progress = uniqueWords - threshold;
  return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
}

export function shouldLevelUp(uniqueWords: number, current: CEFRLevel): boolean {
  const next = LEVELS[current].next;
  if (!next) return false;
  return uniqueWords >= LEVELS[next].threshold;
}

export const LEVEL_DESCRIPTIONS: Record<CEFRLevel, string> = {
  A1: 'Sei o básico, frases simples',
  A2: 'Consigo me virar em situações do dia a dia',
  B1: 'Mantenho conversas sobre temas familiares',
  B2: 'Falo com fluência sobre vários assuntos',
  C1: 'Me expresso com naturalidade',
  C2: 'Domínio quase nativo',
};

export const STOPWORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'on', 'at',
  'for', 'by', 'with', 'and', 'or', 'but', 'so', 'if', 'as', 'that',
  'this', 'these', 'those', 'not', 'no', 'yes', 'ok', 'oh', 'um',
]);
