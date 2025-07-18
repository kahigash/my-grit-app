// /pages/api/validate-answer.ts
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

  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: '質問と回答が必要です。' });
  }

  const prompt = `
以下の質問と回答について、回答が適切かどうかを以下の基準で評価してください：

- 回答が極端に短くないか（例：「わかりません」「ないです」など）
- 冗談やふざけた内容でないか
- 質問の意図に合っているか

適切なら "valid": true を返してください。
不適切な場合は "valid": false と "reason" に理由を簡潔に記述し、"needsRetry": true を返してください。

出力形式：
{
  "valid": true または false,
  "needsRetry": true または false,
  "reason": "理由"
}

質問：
${question}

回答：
${answer}
`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content?.trim() || '{}';
    const result = JSON.parse(content);

    res.status(200).json(result);
  } catch (err: any) {
    console.error('回答検証エラー:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to validate answer' });
  }
}
