import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL_NAME = process.env.MODEL_NAME || 'gpt-3.5-turbo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
    });

    const generated = response.choices?.[0]?.message?.content || '';
    res.status(200).json({ result: generated });
  } catch (error: any) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
}
