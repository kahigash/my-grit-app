import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.MODEL_NAME || 'gpt-4';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const messages = req.body.messages;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'あなたは親しみやすいコーチとして、GRIT（やり抜く力）を測るための質問を1つずつ出してください。質問は自由回答形式にしてください。',
        },
        ...messages,
      ],
      temperature: 0.7,
    });

    const generatedMessage = response.choices[0].message?.content ?? '';

    res.status(200).json({ message: generatedMessage });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Error generating question' });
  }
}
