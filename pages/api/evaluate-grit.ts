// /pages/api/evaluate-grit.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL_NAME = process.env.MODEL_NAME ?? 'gpt-4o';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  const userAnswers = messages
    .filter((m: any) => m.role === 'user')
    .map((m: any) => m.content)
    .join('\n---\n');

  const prompt = `
以下は面接の回答記録です。この内容からGRITの以下4要素について、それぞれ0〜5点で評価してください。

【評価項目】
- 粘り強さ（Perseverance）
- 情熱（Passion）
- 目標志向性（Goal Orientation）
- 回復力（Resilience）

それぞれ以下のJSON形式で数値（整数）で返してください。該当する情報がなければ「0」を返してください。

出力形式：
{
  "perseverance": 数値,
  "passion": 数値,
  "goal_orientation": 数値,
  "resilience": 数値
}

回答記録：
${userAnswers}
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices?.[0]?.message?.content?.trim() || '{}';
    const json = JSON.parse(content);

    res.status(200).json(json);
  } catch (err: any) {
    console.error('GRITスコア評価エラー:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to evaluate GRIT scores' });
  }
}
