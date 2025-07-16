// pages/api/generate-question.ts
import OpenAI from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { history } = req.body;
  const messages = history.map((item: { q: string; a: string }) => ({
    role: 'user',
    content: `Q: ${item.q}\nA: ${item.a}`,
  }));

  messages.push({
    role: 'system',
    content:
      '次の質問を1つだけ考えてください。相手の回答内容を踏まえて、GRIT（情熱と粘り強さ）を見抜くために有効な質問を、できるだけ自然な対話として作成してください。',
  });

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    });

    const nextQuestion = chat.choices[0].message.content?.trim() || 'ありがとうございます。以上です。';
    res.status(200).json({ question: nextQuestion });
  } catch (err: any) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'Failed to generate question' });
  }
}
