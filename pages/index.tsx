import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

type Role = 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadInitialQuestion = async () => {
      try {
        const res = await axios.post('/api/generate-question', { messages: [] });
        const initialMessage: Message = {
          role: 'assistant',
          content: res.data.result,
        };
        setMessages([initialMessage]);
      } catch (err) {
        setError('初回の質問取得に失敗しました。');
      }
    };
    loadInitialQuestion();
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/generate-question', {
        messages: updatedMessages,
      });

      if (res.data.result) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: res.data.result,
        };
        setMessages([...updatedMessages, assistantMessage]);
      } else {
        setError('質問の取得に失敗しました。');
      }
    } catch (err) {
      setError('エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>GRIT測定インタビュー</h1>

      {messages.map((msg, idx) => {
        const isQuestion = msg.role === 'assistant';
        const qNum = messages
          .slice(0, idx + 1)
          .filter((m) => m.role === 'assistant').length;

        return (
          <div key={idx} style={{ marginBottom: '1rem' }}>
            <strong>{isQuestion ? `Q: 質問 ${qNum} / 5` : 'A:'}</strong>{' '}
            {msg.content}
          </div>
        );
      })}

      <div ref={messagesEndRef} />

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && messages.filter((m) => m.role === 'assistant').length < 5 && (
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ここに回答を入力してください"
            rows={3}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          <button onClick={handleSubmit}>送信</button>
        </div>
      )}
    </div>
  );
}
