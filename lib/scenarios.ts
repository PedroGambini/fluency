import { CEFRLevel } from './levels';

export interface Scenario {
  id: string;
  name: string;
  icon: string;
  theme: string;
  suggestedLevel: CEFRLevel;
  aiRole: string;
  mission: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'introductions',
    name: 'Apresentações',
    icon: '👋',
    theme: 'social',
    suggestedLevel: 'A1',
    aiRole: `You are a friendly person meeting the user for the first time. Ask about their name, where they're from, and their hobbies. Keep it light and welcoming.`,
    mission: 'Apresente-se e conheça a outra pessoa.',
  },
  {
    id: 'restaurant',
    name: 'No Restaurante',
    icon: '🍽️',
    theme: 'survival',
    suggestedLevel: 'A1',
    aiRole: `You are a friendly waiter at a casual restaurant. Take the customer's order, answer questions about the menu, and handle any requests politely.`,
    mission: 'Faça seu pedido e interaja com o garçom.',
  },
  {
    id: 'airport',
    name: 'No Aeroporto',
    icon: '✈️',
    theme: 'survival',
    suggestedLevel: 'A2',
    aiRole: `You are an airline check-in attendant. The user's flight has been delayed by 2 hours. Help them rebook, find their gate, and handle their frustration calmly and professionally.`,
    mission: 'Resolva o problema do seu voo atrasado.',
  },
  {
    id: 'making_friends',
    name: 'Fazendo Amizade',
    icon: '😊',
    theme: 'social',
    suggestedLevel: 'B1',
    aiRole: `You are a new colleague at work having a casual conversation. Talk about weekend plans, interests, local restaurants, movies. Be naturally curious and friendly.`,
    mission: 'Converse casualmente e crie uma conexão.',
  },
  {
    id: 'job_interview',
    name: 'Entrevista de Emprego',
    icon: '💼',
    theme: 'professional',
    suggestedLevel: 'B2',
    aiRole: `You are a recruiter interviewing the user for a mid-level position in their field. Ask about their experience, strengths, challenges they've faced, and why they want this role.`,
    mission: 'Impressione o recrutador e consiga o emprego.',
  },
  {
    id: 'project_pitch',
    name: 'Apresentando um Projeto',
    icon: '📊',
    theme: 'professional',
    suggestedLevel: 'B2',
    aiRole: `You are a senior manager or client listening to the user's project pitch. Ask probing questions about feasibility, timeline, budget, and impact. Be constructively critical.`,
    mission: 'Apresente seu projeto de forma convincente.',
  },
  {
    id: 'debate',
    name: 'Debate de Opiniões',
    icon: '💬',
    theme: 'complex',
    suggestedLevel: 'C1',
    aiRole: `You are an intelligent, well-read person who politely disagrees with the user on a topic they choose. Challenge their reasoning, ask for evidence, and present counterarguments. Stay respectful and intellectually engaged.`,
    mission: 'Defenda seu ponto de vista com argumentos sólidos.',
  },
  {
    id: 'storytelling',
    name: 'Contando uma História',
    icon: '📖',
    theme: 'emotional',
    suggestedLevel: 'A1',
    aiRole: `You are a warm, curious friend who loves hearing stories. Listen attentively as the user shares any story from their life. Ask follow-up questions to help them elaborate and express themselves.`,
    mission: 'Conte uma história da sua vida.',
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}
