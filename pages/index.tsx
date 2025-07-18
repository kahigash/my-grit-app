import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Message 型定義
type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  const maxQuestions = 5;

  useEffect(() => {
    const initialMessage: Message = {
      role: 'assistant',
      content: `質問 1 / ${maxQuestions}\n\nこれまでに、どうしてもやり遂げたいと思って粘り強く取り組んだ長期的な目標やプロジェクトがあれば教えてください。その際に直面した最も大きな困難と、それをどう乗り越えたかを詳しく聞かせてください。`
    };
    setMessages([initialMessage]);
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const updatedMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    const userMessages = updatedMessages.filter(msg => msg.role === 'user');
    const assistantMessages = updatedMessages.filter(msg => msg.role === 'assistant');
    const questionCount = assistantMessages.length;

    try {
      const response = await axios.post('/api/generate-question', {
        messages: updatedMessages
      });

      let newContent = response.data.message;

      if (userMessages.length + 1 >= maxQuestions) {
        newContent += `\n\n以上で質問は終了です。お疲れ様でした。`;
      } else {
        newContent = `質問 ${questionCount + 1} / ${maxQuestions}\n\n` + newContent;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: newContent }]);
    } catch (err: any) {
      console.error(err);
      setError('エラーが発生しました。もう一度お試しください。');
    }

    setLoading(false);
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>GRIT測定インタビュー</h1>
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.role === 'user' ? 'A' : 'Q'}:</strong> {msg.content}</p>
        ))}
        <div ref={messageEndRef} />
      </div>
      {!loading && messages.filter(m => m.role === 'user').length < maxQuestions && (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            cols={50}
            placeholder="ここに回答を入力してください"
          />
          <br />
          <button onClick={handleSubmit}>送信</button>
        </>
      )}
      {loading && <p>送信中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
