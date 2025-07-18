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
以下の面接回答を読んで、各回答から見られるGRITの構成要素を総合的に評価してください。

【評価項目】
- 粘り強さ（perseverance）
- 情熱（passion）
- 目標志向性（goal_orientation）
- 回復力（resilience）

以下のJSON形式で、スコア（0～5）と影響した要素の配列を返してください。
{
  "score": {
    "perseverance": 数値,
    "passion": 数値,
    "goal_orientation": 数値,
    "resilience": 数値
  },
  "relatedFactors": ["perseverance", "passion"]
}

該当しない場合は0、relatedFactorsがなければ空配列にしてください。

回答全文：
${userAnswers}
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content?.trim() || '{}';
    const json = JSON.parse(text);

    res.status(200).json(json);
  } catch (err: any) {
    console.error('GRITスコア評価エラー:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to evaluate GRIT scores' });
  }
}
