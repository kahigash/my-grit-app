import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { messages } = req.body;

  const userAnswers = messages.filter((m: any) => m.role === 'user').map((m: any) => m.content);
  const lastAnswer = userAnswers[userAnswers.length - 1];

  const prompt = `
あなたはGRIT（非認知能力）の評価者です。
以下の「ユーザーの回答」について、次の4つの構成要素に対する関連度を**絶対評価**してください：

- perseverance（粘り強さ）
- passion（情熱）
- goal_orientation（目標志向性）
- resilience（回復力）

以下のルールに従ってスコアをつけてください：

- 各スコアは0〜5の整数。
- スコアはこの回答単体から判断し、**過去の回答との比較や合計スコアは一切考慮しない**。
- 減点は絶対に行わず、**0点を下回ることは不可。**
- スコアが0でない場合、その要素を "relatedFactors" に含めてください。
- 出力は次のJSON形式に厳密に従ってください（先頭に何もつけないで）：

{
  "score": {
    "perseverance": 数値（0〜5）,
    "passion": 数値（0〜5）,
    "goal_orientation": 数値（0〜5）,
    "resilience": 数値（0〜5）
  },
  "relatedFactors": ["perseverance", "goal_orientation", ...]
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

    res.status(200).json({
      score: parsed.score,
      relatedFactors: parsed.relatedFactors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GRIT評価に失敗しました' });
  }
}
