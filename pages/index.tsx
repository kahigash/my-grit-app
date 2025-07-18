import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 初回の質問を自動で挿入
    if (messages.length === 0) {
      const initialQuestion = 'これまでに、どうしてもやり遂げたいと思って粘り強く取り組んだ長期的な目標やプロジェクトがあれば教えてください。その際に直面した最も大きな困難と、それをどう乗り越えたかを詳しく聞かせてください。';
      setMessages([{ role: 'assistant', content: initialQuestion }]);
    }
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const updatedMessages = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/generate-question', { messages: updatedMessages });
      const nextQuestion = response.data.result;
      setMessages([...updatedMessages, { role: 'assistant', content: nextQuestion }]);
    } catch (err) {
      setError('質問の生成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const questionCount = Math.floor(messages.filter(msg => msg.role === 'assistant').length);
  const isFinished = questionCount >= 6; // 初回+5問

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <h1>GRIT測定インタビュー</h1>
      {messages.map((msg, index) => (
        <div key={index} style={{ whiteSpace: 'pre-wrap', marginBottom: '1em' }}>
          {msg.role === 'assistant' && (
            <strong>
              質問 {Math.min(index / 2 + 1, 6)} / 5
              <br />
            </strong>
          )}
          <span><strong>{msg.role === 'user' ? 'A: ' : 'Q: '}</strong>{msg.content}</span>
        </div>
      ))}

      {!isFinished && (
        <>
          <textarea
            rows={4}
            style={{ width: '100%', marginBottom: '10px' }}
            placeholder="ここに回答を入力してください"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <br />
          <button onClick={handleSubmit} disabled={loading}>送信</button>
        </>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div ref={bottomRef} />
    </div>
  );
}
