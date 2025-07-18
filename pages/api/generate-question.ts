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

以下のルールに従って、質問を進めてください：

- まず候補者の前の回答に対して、簡単な共感・理解・驚きなどの感想を述べてください（例：「その経験は非常に印象的ですね」など）。
- 感想のあとに、新しい質問を1つ追加してください。前の回答を掘り下げても、新しい観点から聞いても構いません。
- 「あなたはGRITがありますか？」など直接的な聞き方は禁止です。
- 質問は必ず日本語で、1つだけにしてください。
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
