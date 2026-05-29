import { CEFRLevel } from './levels';

export interface Scenario {
  id: string;
  name: string;
  icon: string;
  theme: string;
  suggestedLevel: CEFRLevel;
  description: string;
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
    description: 'Conheça alguém novo! Você vai se apresentar, falar de onde vem, seus hobbies e fazer perguntas básicas.',
    aiRole: `You are a friendly person meeting the user for the first time. Ask about their name, where they're from, and their hobbies. Keep it light and welcoming.`,
    mission: 'Apresente-se e conheça a outra pessoa.',
  },
  {
    id: 'restaurant',
    name: 'No Restaurante',
    icon: '🍽️',
    theme: 'survival',
    suggestedLevel: 'A1',
    description: 'Você está num restaurante. Vai pedir comida, tirar dúvidas sobre o cardápio e interagir com o garçom.',
    aiRole: `You are a friendly waiter at a casual restaurant. Take the customer's order, answer questions about the menu, and handle any requests politely.`,
    mission: 'Faça seu pedido e interaja com o garçom.',
  },
  {
    id: 'shopping',
    name: 'Fazendo Compras',
    icon: '🛍️',
    theme: 'survival',
    suggestedLevel: 'A1',
    description: 'Você está numa loja. Vai perguntar sobre preços, tamanhos, cores e decidir o que comprar.',
    aiRole: `You are a helpful shop assistant in a clothing store. Help the customer find items, answer questions about sizes, prices, and colors. Be friendly and attentive.`,
    mission: 'Encontre o que procura e finalize a compra.',
  },
  {
    id: 'airport',
    name: 'No Aeroporto',
    icon: '✈️',
    theme: 'survival',
    suggestedLevel: 'A2',
    description: 'Seu voo foi atrasado 2 horas. Você precisa resolver a situação com o atendente, descobrir o portão e lidar com a espera.',
    aiRole: `You are an airline check-in attendant. The user's flight has been delayed by 2 hours. Help them rebook, find their gate, and handle their frustration calmly and professionally.`,
    mission: 'Resolva o problema do seu voo atrasado.',
  },
  {
    id: 'hotel',
    name: 'No Hotel',
    icon: '🏨',
    theme: 'survival',
    suggestedLevel: 'A2',
    description: 'Você chegou ao hotel. Vai fazer o check-in, pedir informações sobre os serviços e resolver um pequeno problema no quarto.',
    aiRole: `You are a hotel receptionist. The user is checking in. Help with their reservation, explain hotel amenities, and handle a small issue with their room (e.g., the TV isn't working or the room faces a noisy street).`,
    mission: 'Faça check-in e resolva o problema do quarto.',
  },
  {
    id: 'making_friends',
    name: 'Fazendo Amizade',
    icon: '😊',
    theme: 'social',
    suggestedLevel: 'B1',
    description: 'Você está conversando com um colega de trabalho. Vão falar sobre fim de semana, interesses e talvez combinar algo.',
    aiRole: `You are a new colleague at work having a casual conversation. Talk about weekend plans, interests, local restaurants, movies. Be naturally curious and friendly.`,
    mission: 'Converse casualmente e crie uma conexão.',
  },
  {
    id: 'job_interview',
    name: 'Entrevista de Emprego',
    icon: '💼',
    theme: 'professional',
    suggestedLevel: 'B2',
    description: 'Uma entrevista de emprego real. O recrutador vai perguntar sobre sua experiência, pontos fortes e por que você quer a vaga.',
    aiRole: `You are a recruiter interviewing the user for a mid-level position in their field. Ask about their experience, strengths, challenges they've faced, and why they want this role.`,
    mission: 'Impressione o recrutador e consiga o emprego.',
  },
  {
    id: 'project_pitch',
    name: 'Apresentando um Projeto',
    icon: '📊',
    theme: 'professional',
    suggestedLevel: 'B2',
    description: 'Apresente uma ideia de projeto. O cliente vai fazer perguntas difíceis sobre viabilidade, custo e impacto.',
    aiRole: `You are a senior manager or client listening to the user's project pitch. Ask probing questions about feasibility, timeline, budget, and impact. Be constructively critical.`,
    mission: 'Apresente seu projeto de forma convincente.',
  },
  {
    id: 'debate',
    name: 'Debate de Opiniões',
    icon: '💬',
    theme: 'complex',
    suggestedLevel: 'C1',
    description: 'Uma conversa intelectual. Você vai defender um ponto de vista enquanto seu interlocutor apresenta contra-argumentos educados.',
    aiRole: `You are an intelligent, well-read person who politely disagrees with the user on a topic they choose. Challenge their reasoning, ask for evidence, and present counterarguments. Stay respectful and intellectually engaged.`,
    mission: 'Defenda seu ponto de vista com argumentos sólidos.',
  },
  {
    id: 'storytelling',
    name: 'Contando uma História',
    icon: '📖',
    theme: 'emotional',
    suggestedLevel: 'A1',
    description: 'Compartilhe uma história da sua vida com um amigo curioso. Ele vai fazer perguntas para você se aprofundar.',
    aiRole: `You are a warm, curious friend who loves hearing stories. Listen attentively as the user shares any story from their life. Ask follow-up questions to help them elaborate and express themselves.`,
    mission: 'Conte uma história da sua vida.',
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}
