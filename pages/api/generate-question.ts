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
    // userによる回答回数をカウント（"user" で "回答" を含む場合）
    const answerCount = messages.filter(
      (msg: any) => msg.role === 'user' && typeof msg.content === 'string' && msg.content.trim() !== ''
    ).length;

    let rawOutput: string;

    if (answerCount >= 5) {
      const lastAnswer = messages[messages.length - 1]?.content ?? '';
      const summaryPrompt = `
以下は候補者の最終回答です。

${lastAnswer}

この内容に対する簡単な共感コメントを述べた上で、「以上で質問は終了です。お疲れ様でした。」というメッセージを続けてください。
- 出力は150文字以内。
- 丁寧かつ温かい表現でお願いします。
- ラベルや記号は使わず、自然な文章にしてください。
`;

      const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: summaryPrompt }
        ],
        temperature: 0.7,
      });

      rawOutput = response.choices?.[0]?.message?.content?.trim() || '';
    } else {
      const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: fullMessages,
        temperature: 0.7,
      });

      rawOutput = response.choices?.[0]?.message?.content?.trim() || '';
    }

    // 出力から「Q1:」「Q:」「A:」を削除（念のため）
    const cleanedOutput = rawOutput.replace(/^Q\d*[:：]\s*/i, '').replace(/^A[:：]\s*/i, '');

    if (!cleanedOutput) {
      return res.status(500).json({ error: 'No content generated' });
    }

    res.status(200).json({ result: cleanedOutput });
  } catch (error: any) {
    console.error('OpenAI Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate question' });
  }
}
