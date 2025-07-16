import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  const { history } = req.body;
  const messages = history.map((item, index) => ({
    role: 'user',
    content: `Q${index + 1}: ${item.q}\nA: ${item.a}`
  }));

  messages.push({
    role: 'user',
    content: 'この履歴を元に、次の適切なインタビューフォロー質問を1つ返してください。'
  });

  try {
    const chat = await openai.createChatCompletion({
      model: 'gpt-4',
      messages,
    });

    const question = chat.data.choices[0].message.content.trim();
    res.status(200).json({ question });
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'API Error' });
  }
}
