'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import axios from 'axios';

type Role = 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}

interface GritScore {
  perseverance: number;
  passion: number;
  goal_orientation: number;
  resilience: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gritScore, setGritScore] = useState<GritScore>({
    perseverance: 0,
    passion: 0,
    goal_orientation: 0,
    resilience: 0,
  });

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
      // 質問生成API
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

      // GRITスコア再評価
      const scoreRes = await axios.post('/api/evaluate-grit', {
        messages: updatedMessages,
      });

      if (scoreRes.data) {
        setGritScore(scoreRes.data);
      }
    } catch (err) {
      setError('エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{process.env.NEXT_PUBLIC_APP_TITLE || 'GRIT測定アプリ'}</title>
      </Head>

      <div style={{ padding: '2rem', position: 'relative' }}>
        <h1>GRIT測定インタビュー</h1>

        {/* GRITスコア表示 */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: '#f0f0f0',
            padding: '1rem',
            borderRadius: '8px',
            width: '220px',
            fontSize: '0.9rem',
            boxShadow: '0 0 5px rgba(0,0,0,0.1)',
          }}
        >
          <strong>GRITスコア</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
            <li>粘り強さ: {gritScore.perseverance} / 5</li>
            <li>情熱: {gritScore.passion} / 5</li>
            <li>目標志向性: {gritScore.goal_orientation} / 5</li>
            <li>回復力: {gritScore.resilience} / 5</li>
          </ul>
        </div>

        {/* チャット履歴 */}
        {messages.map((msg, idx) => {
          const isQuestion = msg.role === 'assistant';
          const isClosing = isQuestion && msg.content.includes('以上で質問は終了');
          const previousQuestions = messages
            .slice(0, idx)
            .filter(
              (m) => m.role === 'assistant' && !m.content.includes('以上で質問は終了')
            ).length;

          return (
            <div key={idx} style={{ marginBottom: '1rem' }}>
              <strong>
                {isQuestion && !isClosing
                  ? `Q: 質問 ${previousQuestions + 1} / 5`
                  : !isQuestion
                  ? 'A:'
                  : ''}
              </strong>{' '}
              {msg.content}
            </div>
          );
        })}

        <div ref={messagesEndRef} />

        {error && <div style={{ color: 'red' }}>{error}</div>}

        {!loading &&
          messages.filter((m) => m.role === 'assistant').length >
            messages.filter((m) => m.role === 'user').length && (
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
    </>
  );
}
