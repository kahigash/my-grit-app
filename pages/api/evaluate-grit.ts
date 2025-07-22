import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { messages } = req.body;

  const userAnswers = messages.filter((m: any) => m.role === 'user').map((m: any) => m.content);
  const lastAnswer = userAnswers[userAnswers.length - 1];

  if (!lastAnswer) {
    return res.status(400).json({ error: '最新の回答が見つかりませんでした' });
  }

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
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('JSON形式の出力が見つかりませんでした');
    }

    const parsed = JSON.parse(match[0]);

    // 念のためバリデーション
    const score = parsed.score ?? {};
    const relatedFactors = parsed.relatedFactors ?? [];

    // 数値が0〜5の範囲内であるかチェック
    for (const key of ['perseverance', 'passion', 'goal_orientation', 'resilience']) {
      const value = score[key];
      if (typeof value !== 'number' || value < 0 || value > 5) {
        throw new Error(`無効なスコア: ${key}=${value}`);
      }
    }

    res.status(200).json({
      score,
      relatedFactors,
    });
  } catch (err) {
    console.error('GRIT評価エラー:', err);
    res.status(500).json({ error: 'GRIT評価に失敗しました' });
  }
}
