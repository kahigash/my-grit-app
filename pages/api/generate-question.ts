import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL_NAME = process.env.MODEL_NAME ?? 'gpt-4o';
const MAX_QUESTIONS = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  const userAnswers = messages.filter((m: any) => m.role === 'user');
  const isLastQuestion = userAnswers.length >= MAX_QUESTIONS;

  const systemPrompt = `
あなたは企業の採用面接におけるインタビュアーです。候補者の「GRIT（やり抜く力）」を測定するため、以下の方針で質問を作成してください。

【質問方針】
- 質問は必ず日本語で、1つだけ提示してください。
- 「あなたはGRITがありますか？」のような直接的な表現は禁止です。
- 候補者の経験・行動・思考パターンからGRITの傾向がわかるような、間接的かつ具体的な質問を出してください。
- 前の回答に対して短い共感コメントを自然な文章に組み込んでから、続けて次の質問を提示してください。
- 「共感コメント:」「次の質問:」などの表記は使わず、ひとつの自然な質問文として出力してください。
- 回答の深掘りを意識してください。前の回答内容を引用しながら「〜とのことですが、なぜそうしたのか？」「そのときどう感じましたか？」のような形で掘り下げてください。
- 出力文には「Q1:」「Q:」「A:」などのラベルを含めないでください。
- 出力は150文字以内に収めてください。
`;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  try {
    if (isLastQuestion) {
      const lastUserAnswer = userAnswers[userAnswers.length - 1]?.content || '';
      const summaryPrompt = `
以下の候補者の回答に対し、簡単な共感コメントを添えて締めのメッセージを作成してください。最後に「以上で質問は終了です。お疲れ様でした。」と付け加えてください。

【回答】
${lastUserAnswer}

【出力制約】
- 120文字以内で簡潔にまとめてください。
- 「Q:」「A:」などのラベルは含めないでください。
`;

      const summaryMessages = [
        { role: 'system', content: summaryPrompt },
      ];

      const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: summaryMessages as any,
        temperature: 0.7,
      });

      const result = response.choices?.[0]?.message?.content?.trim() || '';
      return res.status(200).json({ result });
    }

    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: fullMessages as any,
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
