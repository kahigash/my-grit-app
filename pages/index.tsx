import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

type Role = 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'これまでに、どうしてもやり遂げたいと思って粘り強く取り組んだ長期的な目標やプロジェクトがあれば教えてください。その際に直面した最も大きな困難と、それをどう乗り越えたかを詳しく聞かせてください。',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const updatedMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/generate-question', {
        messages: updatedMessages,
      });
      const result = response.data.result;
      setMessages([...updatedMessages, { role: 'assistant', content: result }]);
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>GRIT測定インタビュー</h1>
      <div style={{ marginBottom: '1rem' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <strong>{msg.role === 'user' ? 'A' : 'Q'}:</strong> {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {!loading && messages.length < 12 && (
        <div>
          <textarea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ここに回答を入力してください"
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          <button onClick={handleSubmit}>送信</button>
        </div>
      )}
      {loading && <p>生成中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
