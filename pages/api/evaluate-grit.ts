import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const initialScore = {
  perseverance: 0,
  passion: 0,
  goal_orientation: 0,
  resilience: 0,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { messages } = req.body;

  const userAnswers = messages.filter((m: any) => m.role === 'user').map((m: any) => m.content);
  const lastAnswer = userAnswers[userAnswers.length - 1];

  const prompt = `
以下のユーザーの回答を読み、GRITの4つの構成要素（perseverance, passion, goal_orientation, resilience）にどの程度関連するかを分析してください。
関連する要素と、その理由を日本語で簡潔に述べてください。出力は以下の形式で出してください。

{
  "score": {
    "perseverance": 数値（0〜5）,
    "passion": 数値（0〜5）,
    "goal_orientation": 数値（0〜5）,
    "resilience": 数値（0〜5）
  },
  "relatedFactors": ["関連する要素の英語名"]
}

ユーザーの回答:
${lastAnswer}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content || '';

    // JSONパース処理
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('JSON形式の出力が見つかりませんでした');
    }

    const parsed = JSON.parse(match[0]);

    // クライアント側に過去スコアが保持されている前提
    // そのため delta 計算は index.tsx 側で行います
    res.status(200).json({
      score: parsed.score,
      relatedFactors: parsed.relatedFactors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GRIT評価に失敗しました' });
  }
}
