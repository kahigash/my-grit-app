export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { history } = req.body;

  const messages = [
    {
      role: 'system',
      content: 'あなたは応募者の回答に応じてGRITを測る質問を自然な会話形式で作成する面接官です。'
    },
    ...history.map(item => ({ role: 'user', content: `質問: ${item.q}\n回答: ${item.a}` })),
    {
      role: 'user',
      content: 'この流れに自然につながる、次の質問を1つ日本語で出してください。'
    }
  ];

  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = await completion.json();
    const nextQuestion = data.choices?.[0]?.message?.content?.trim();

    res.status(200).json({ question: nextQuestion });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate question.' });
  }
}