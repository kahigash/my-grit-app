import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Message型に'system'も許可
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const updatedMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/generate-question', { messages: updatedMessages });
      const newQuestion = response.data.result;
      setMessages([...updatedMessages, { role: 'assistant', content: newQuestion }]);
    } catch (err: any) {
      console.error(err);
      setError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>GRIT測定インタビュー</h1>

      {messages.map((msg, index) => (
        <div key={index} style={{ marginBottom: '1rem' }}>
          <strong>{msg.role === 'user' ? 'A' : msg.role === 'assistant' ? 'Q' : ''}</strong>: {msg.content}
        </div>
      ))}

      <div ref={bottomRef} />

      {messages.filter(m => m.role === 'assistant').length < 6 && (
        <>
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ここに回答を入力してください"
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', marginBottom: '0.5rem' }}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            送信
          </button>
        </>
      )}

      {loading && <p>生成中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
