import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL_NAME = process.env.MODEL_NAME ?? 'gpt-3.5-turbo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { questions, answers } = req.body;

  if (!questions || !answers || questions.length !== answers.length) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  const messages = [
    { role: 'system', content: 'あなたは候補者のGRIT（やり抜く力）を5問の面接回答から分析し、診断結果を出すインタビュアーです。' },
    ...questions.map((q: string, i: number) => ({
      role: 'user',
      content: `Q${i + 1}: ${q}\nA: ${answers[i]}`,
    })),
    { role: 'user', content: '以上の回答をもとに、候補者のGRITに関する簡潔な診断結果を出してください。' },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
    });

    const result = response.choices?.[0]?.message?.content || '';
    res.status(200).json({ result });
  } catch (error) {
    console.error('OpenAI Error (generate-result):', error);
    res.status(500).json({ error: 'Failed to generate result' });
  }
}
