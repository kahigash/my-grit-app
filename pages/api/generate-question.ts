import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_NAME = process.env.MODEL_NAME || 'gpt-3.5-turbo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API called:', req.method);  // ✅ 呼び出しログ

  if (req.method !== 'POST') {
    console.log('Invalid method');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  console.log('Received messages:', messages);  // ✅ 入力メッセージ確認

  if (!messages || !Array.isArray(messages)) {
    console.log('Invalid messages format');
    return res.status(400).json({ error: 'Invalid request format' });
  }

  try {
    console.log('Sending request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
    });
    console.log('OpenAI response:', response);  // ✅ 応答確認

    const generated = response.choices?.[0]?.message?.content || '';
    console.log('Generated content:', generated);

    res.status(200).json({ result: generated });
  } catch (error) {
    console.error('Error calling OpenAI:', error);  // ✅ エラーログ
    res.status(500).json({ error: 'Failed to generate question' });
  }
}
