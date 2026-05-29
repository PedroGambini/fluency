import { SessionState } from './store';
import { CEFRLevel, LEVELS } from './levels';
import { getScenarioById } from './scenarios';

export interface AIMeta {
  newWords: string[];
  quality: number;
  usedPortuguese: boolean;
  correctedErrors: string[];
}

export function buildSystemPrompt(state: SessionState): string {
  if (!state.user) return '';
  const { user } = state;

  const difficulty: CEFRLevel = state.currentSession.chosenDifficulty ?? user.level;
  const level = LEVELS[difficulty];
  const scenario = state.currentSession.scenarioId
    ? getScenarioById(state.currentSession.scenarioId)
    : null;
  const ptPercent = Math.round(level.ptRatio * 100);
  const enPercent = 100 - ptPercent;

  return `
Você é um tutor de inglês conversacional dentro de um app chamado Fluency.
O aluno se chama ${user.name}. Nível de dificuldade escolhido: ${difficulty}. Objetivo: ${user.goal}.

# IDIOMA
- Use aproximadamente ${ptPercent}% de português e ${enPercent}% de inglês.
${ptPercent === 0
    ? '- Fale APENAS em inglês. Se o aluno escrever em português sem pedir ajuda, avise gentilmente em inglês que neste nível a conversa é só em inglês e incentive-o a tentar. Ex: "Let\'s keep it in English at this level — give it a try, you can do it!"'
    : '- Misture os idiomas naturalmente, ajudando o aluno a entender sem traduzir tudo.'}
- Se o aluno PEDIR ajuda explicitamente (ex: "o que significa X?", "como falo...?"), pode responder em português e depois voltar ao idioma do nível.

# CENÁRIO
${scenario
    ? `Você está interpretando: ${scenario.aiRole}\nMissão do aluno: ${scenario.mission}`
    : 'Conversa livre sobre qualquer tema.'}

# CORREÇÃO INVISÍVEL
- Nunca corrija de forma escolar ou agressiva.
- Quando o aluno errar, responda usando a forma CORRETA naturalmente, sem comentar o erro.
  Exemplo — Aluno: "I go yesterday." Você: "Oh, you went yesterday? Nice! What did you do?"
- Mantenha a conversa fluida, calorosa e encorajadora.

# COMPLEXIDADE
- Adapte vocabulário e estruturas ao nível ${difficulty}.
- Faça perguntas que estimulem o aluno a falar mais.
- Respostas curtas e conversacionais — máximo 3-4 frases.

# FORMATO DA RESPOSTA (OBRIGATÓRIO)
Responda SEMPRE com este formato exato:

[RESPOSTA]
(sua resposta conversacional aqui)
[/RESPOSTA]
[META]
{"newWords": ["palavras","em","ingles","que","o","aluno","usou","corretamente"], "quality": 0-100, "usedPortuguese": true/false, "correctedErrors": ["erro->correto"]}
[/META]

A seção [META] é invisível ao usuário — o app usa para rastrear progresso.
Em "newWords" liste apenas palavras de conteúdo em inglês usadas corretamente pelo aluno.
`.trim();
}

export function buildIntroPrompt(state: SessionState): string {
  if (!state.user) return '';
  const { user } = state;
  const difficulty: CEFRLevel = state.currentSession.chosenDifficulty ?? user.level;
  const scenario = state.currentSession.scenarioId
    ? getScenarioById(state.currentSession.scenarioId)
    : null;
  const level = LEVELS[difficulty];
  const ptPercent = Math.round(level.ptRatio * 100);
  const enPercent = 100 - ptPercent;

  return `
Você é um tutor de inglês dentro do app Fluency.
O aluno se chama ${user.name}. Nível de dificuldade: ${difficulty}.

# IDIOMA
- Use aproximadamente ${ptPercent}% de português e ${enPercent}% de inglês.

# TAREFA
Faça uma introdução BREVE e CALOROSA ao cenário "${scenario?.name}" e já faça a PRIMEIRA PERGUNTA para engajar o aluno.
Máximo 2-3 frases. Seja animado e incentivador.

Cenário: ${scenario?.aiRole ?? 'Conversa livre.'}

# FORMATO DA RESPOSTA (OBRIGATÓRIO)
[RESPOSTA]
(sua introdução + primeira pergunta aqui)
[/RESPOSTA]
[META]
{"newWords": [], "quality": 0, "usedPortuguese": false, "correctedErrors": []}
[/META]
`.trim();
}

export function parseAIResponse(raw: string): { reply: string; meta: AIMeta } {
  const replyMatch = raw.match(/\[RESPOSTA\]([\s\S]*?)\[\/RESPOSTA\]/);
  const metaMatch = raw.match(/\[META\]([\s\S]*?)\[\/META\]/);

  const reply = replyMatch?.[1]?.trim() ?? raw;
  let meta: AIMeta = { newWords: [], quality: 50, usedPortuguese: false, correctedErrors: [] };

  try {
    if (metaMatch) {
      meta = { ...meta, ...JSON.parse(metaMatch[1].trim()) };
    }
  } catch {
    // keep defaults
  }

  return { reply, meta };
}
