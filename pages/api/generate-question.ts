import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL_NAME = process.env.MODEL_NAME ?? 'gpt-3.5-turbo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  const systemPrompt = `
あなたは企業の採用面接におけるインタビュアーです。
目的は、候補者の「GRIT（やり抜く力）」を間接的に評価することです。

以下の指針を守ってください：

- 「あなたはGRITがありますか？」「最後までやり抜いたことはありますか？」のような直接的な質問は禁止です。
- 候補者の行動や経験を通じてGRITの有無を判断できるような質問にしてください。
- 候補者の努力、継続性、失敗からの回復、自己調整などが表れるような体験談を引き出す質問にしてください。
- 質問は1つだけ、簡潔かつ具体的に。日本語で出力してください。
`;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: fullMessages,
      temperature: 0.7,
    });

    const generated = response.choices?.[0]?.message?.content?.trim() || '';
    if (!generated) {
      return res.status(500).json({ error: 'No content generated' });
    }

    res.status(200).json({ result: generated });
  } catch (error: any) {
    console.error('OpenAI Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate question' });
  }
}
