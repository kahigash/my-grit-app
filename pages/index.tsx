import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: 'あなたは親しみやすいコーチとして、GRIT（やり抜く力）を測るための質問を1つずつ出してください。質問は自由回答形式にしてください。',
    },
  ]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userInput, setUserInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNextQuestion = async () => {
    setLoading(true);
    const updatedMessages = [
      ...messages,
      { role: 'user', content: userInput },
    ];

    try {
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();
      const newMessage = { role: 'assistant', content: data.message };

      setMessages([...updatedMessages, newMessage]);
      setCurrentQuestion(data.message);
      setQuestionCount((prev) => prev + 1);
      setUserInput('');
    } catch (error) {
      console.error('質問取得エラー:', error);
      setCurrentQuestion('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>GRIT測定インタビュー</h1>
      <p><strong>Q{questionCount + 1}:</strong> {currentQuestion || '最初の質問を始めてください。'}</p>
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        disabled={loading}
        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
      />
      <button
        onClick={fetchNextQuestion}
        disabled={loading || !userInput.trim()}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
      >
        {loading ? '読み込み中...' : '次の質問へ'}
      </button>
    </div>
  );
}
