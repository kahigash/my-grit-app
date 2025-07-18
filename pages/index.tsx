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

interface ScoreChange {
  delta: Partial<GritScore>;
  relatedFactors: string[];
  userAnswer: string;
}

// 英語→日本語マッピング
const labelMap: Record<keyof GritScore, string> = {
  perseverance: '粘り強さ',
  passion: '情熱',
  goal_orientation: '目標志向性',
  resilience: '回復力',
};

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
  const [scoreHistory, setScoreHistory] = useState<ScoreChange[]>([]);

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

      const assistantMessage: Message = {
        role: 'assistant',
        content: res.data.result,
      };
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);

      const scoreRes = await axios.post('/api/evaluate-grit', {
        messages: newMessages,
      });

      if (scoreRes.data) {
        const newScore: GritScore = scoreRes.data.score;
        const newFactors: string[] = scoreRes.data.relatedFactors || [];

        const delta: Partial<GritScore> = {
          perseverance: newScore.perseverance - gritScore.perseverance,
          passion: newScore.passion - gritScore.passion,
          goal_orientation: newScore.goal_orientation - gritScore.goal_orientation,
          resilience: newScore.resilience - gritScore.resilience,
        };

        setGritScore(newScore);
        setScoreHistory([
          ...scoreHistory,
          { delta, relatedFactors: newFactors, userAnswer: input },
        ]);
      }
    } catch (err) {
      setError('エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const assistantCount = messages.filter((m) => m.role === 'assistant').length;
  const userCount = messages.filter((m) => m.role === 'user').length;
  const showInput = assistantCount < 6 && assistantCount > userCount;

  return (
    <>
      <Head>
        <title>{process.env.NEXT_PUBLIC_APP_TITLE || 'GRIT測定アプリ'}</title>
      </Head>

      <div style={{ display: 'flex', padding: '2rem', gap: '2rem' }}>
        {/* 左2/3 */}
        <div style={{ flex: 2 }}>
          <h1>GRIT測定インタビュー</h1>

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

          {showInput && (
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

        {/* 右1/3 */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#f9f9f9',
            padding: '1rem',
            borderRadius: '8px',
            height: '100%',
            overflowY: 'auto',
            fontSize: '0.9rem',
            boxShadow: '0 0 4px rgba(0,0,0,0.1)',
          }}
        >
          <strong>現在のGRITスコア</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
            {(Object.keys(gritScore) as (keyof GritScore)[]).map((key) => (
              <li key={key}>
                {labelMap[key]}: {gritScore[key]} / 5
              </li>
            ))}
          </ul>

          <hr style={{ margin: '1rem 0' }} />
          <strong>スコア変動履歴</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
            {scoreHistory.map((entry, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem' }}>
                <div>回答 {idx + 1}: 「{entry.userAnswer.slice(0, 20)}...」</div>
                <div>
                  影響要素:{' '}
                  {entry.relatedFactors.length > 0
                    ? entry.relatedFactors.map((f) => labelMap[f as keyof GritScore]).join(', ')
                    : 'なし'}
                </div>
                <div>
                  Δ:{' '}
                  {Object.entries(entry.delta)
                    .filter(([, val]) => val !== 0)
                    .map(
                      ([key, val]) =>
                        `${labelMap[key as keyof GritScore]}: ${val > 0 ? '+' : ''}${val}`
                    )
                    .join(', ') || '変化なし'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
