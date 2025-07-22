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
あなたは非認知能力（GRIT）を評価するAIです。
以下のユーザーの回答を読み、GRITの4つの構成要素（perseverance: 粘り強さ, passion: 情熱, goal_orientation: 目標志向性, resilience: 回復力）にどの程度関連するかを**絶対評価**でスコアリングしてください。

- スコアは各要素 0〜5 の範囲で数値で評価してください。
- 前回までのスコアや他の回答との相対比較ではなく、**この回答単体に対する加点のみ**を出力してください。
- 減点（マイナススコア）は絶対に行わず、0を最低点として評価してください。
- 回答のどの部分がどの要素に関連しているかを推定し、その要素の英語名を "relatedFactors" にリストとして出力してください。

出力形式は以下に厳密に従ってください（先頭に何もつけずに純粋なJSON）：

{
  "score": {
    "perseverance": 数値（0〜5）,
    "passion": 数値（0〜5）,
    "goal_orientation": 数値（0〜5）,
    "resilience": 数値（0〜5）
  },
  "relatedFactors": ["perseverance", "passion", ...]
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
