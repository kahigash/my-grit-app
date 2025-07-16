// pages/api/generate-question.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_NAME = process.env.MODEL_NAME || 'gpt-4';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
    });

    const generated = completion.choices?.[0]?.message?.content ?? '';
    console.log('Generated:', generated);

    res.status(200).json({ question: generated }); // ← ✅ 統一
  } catch (error: any) {
    console.error('OpenAI Error:', error.message || error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
}
