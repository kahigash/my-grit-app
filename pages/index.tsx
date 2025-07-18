import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    const updatedMessages = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'エラーが発生しました');
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: data.result }]);
      }
    } catch (err) {
      setError('通信エラーが発生しました');
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>GRIT測定インタビュー</h1>

      {messages.map((msg, idx) => (
        <div key={idx} style={{ marginBottom: '1rem' }}>
          <strong>{msg.role === 'user' ? 'A' : 'Q'}:</strong> {msg.content}
        </div>
      ))}

      {!loading && messages.filter(m => m.role === 'assistant').length < 5 && (
        <div style={{ marginTop: '2rem' }}>
          <textarea
            rows={4}
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
            placeholder="回答を入力してください"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            送信
          </button>
        </div>
      )}

      {loading && <p>送信中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
