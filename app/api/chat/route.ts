import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_HISTORY = 10;

export async function POST(req: Request) {
  try {
    const { systemPrompt, messages } = await req.json();

    const trimmedMessages = messages.slice(-MAX_HISTORY);

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt },
        ...trimmedMessages,
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';

    return Response.json({ text });
  } catch (err) {
    console.error('Chat API error:', err);
    return Response.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}
