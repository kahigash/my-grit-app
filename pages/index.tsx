'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import axios from 'axios';

// 型定義

type Role = 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
  isRetryPrompt?: boolean;
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
  const [isRetry, setIsRetry] = useState(false);
  const [realQuestionCount, setRealQuestionCount] = useState(0);

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
        setMessages([{ role: 'assistant', content: res.data.result }]);
        setRealQuestionCount(1);
      } catch {
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
      const lastQuestion = messages.filter((m) => m.role === 'assistant' && !m.isRetryPrompt).slice(-1)[0]?.content || '';
      const validation = await axios.post('/api/validate-answer', {
        question: lastQuestion,
        answer: input,
      });

      if (!validation.data.valid && validation.data.needsRetry) {
        setMessages([...updatedMessages, {
          role: 'assistant',
          content: 'もう一度、しっかり答えていただけますか？',
          isRetryPrompt: true
        }]);
        setIsRetry(true);
        return;
      }

      const newMessages = [...updatedMessages];
      const newRealQuestionCount = realQuestionCount;

      if (!isRetry) {
        const res = await axios.post('/api/generate-question', { messages: newMessages });
        const assistantMessage: Message = { role: 'assistant', content: res.data.result };
        newMessages.push(assistantMessage);
        setRealQuestionCount(realQuestionCount + 1);
      } else {
        setIsRetry(false);
      }

      if (newRealQuestionCount >= 5) {
        const closingMessage = 'ご協力ありがとうございました。これでインタビューは終了です。お疲れ様でした。';
        newMessages.push({ role: 'assistant', content: closingMessage });
      }

      setMessages(newMessages);

      const scoreRes = await axios.post('/api/evaluate-grit', { messages: newMessages });
      const newScore: GritScore = scoreRes.data.score;
      const newFactors: string[] = scoreRes.data.relatedFactors || [];
      const delta: Partial<GritScore> = {
        perseverance: newScore.perseverance - gritScore.perseverance,
        passion: newScore.passion - gritScore.passion,
        goal_orientation: newScore.goal_orientation - gritScore.goal_orientation,
        resilience: newScore.resilience - gritScore.resilience,
      };

      setGritScore(newScore);
      setScoreHistory([...scoreHistory, { delta, relatedFactors: newFactors, userAnswer: input }]);
    } catch (err) {
      setError('エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const showInput = (() => {
    const realQuestions = messages.filter((m) => m.role === 'assistant' && !m.isRetryPrompt);
    const lastQIndex = messages.findLastIndex((m) => m.role === 'assistant' && !m.isRetryPrompt);
    if (realQuestionCount >= 5) return false;
    if (lastQIndex === -1) return true;

    const afterLastQ = messages.slice(lastQIndex + 1);
    const hasAnswer = afterLastQ.some((m) => m.role === 'user');
    const hasRetryPrompt = afterLastQ.some((m) => m.role === 'assistant' && m.isRetryPrompt);

    return !hasAnswer || hasRetryPrompt;
  })();

  return (
    <>
      <Head>
        <title>{process.env.NEXT_PUBLIC_APP_TITLE || 'GRIT測定アプリ'}</title>
      </Head>

      <div style={{ display: 'flex', padding: '2rem', gap: '2rem' }}>
        <div style={{ flex: 2 }}>
          <h1>GRIT測定インタビュー</h1>
          {messages.map((msg, idx) => {
            const isQ = msg.role === 'assistant';
            const isClosing = isQ && msg.content.includes('以上で質問は終了') || msg.content.includes('インタビューは終了');
            const qNum = messages.slice(0, idx).filter(m => m.role === 'assistant' && !m.isRetryPrompt && !isClosing).length;
            return (
              <div key={idx} style={{ marginBottom: '1rem' }}>
                <strong>{isQ && !isClosing && !msg.isRetryPrompt ? `Q: 質問 ${qNum + 1} / 5` : !isQ ? 'A:' : ''}</strong>{' '}
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

        <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
          <strong>現在のGRITスコア</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
            {(Object.keys(gritScore) as (keyof GritScore)[]).map((key) => (
              <li key={key}>{labelMap[key]}: {gritScore[key]} / 5</li>
            ))}
          </ul>
          <hr style={{ margin: '1rem 0' }} />
          <strong>スコア変動履歴</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
            {scoreHistory.map((entry, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem' }}>
                <div>回答 {idx + 1}: 「{entry.userAnswer.slice(0, 20)}...」</div>
                <div>影響要素: {entry.relatedFactors.length > 0 ? entry.relatedFactors.map(f => labelMap[f as keyof GritScore]).join(', ') : 'なし'}</div>
                <div>Δ: {
                  Object.entries(entry.delta)
                    .filter(([, val]) => val !== 0)
                    .map(([key, val]) => `${labelMap[key as keyof GritScore]}: ${val > 0 ? '+' : ''}${val}`)
                    .join(', ') || '変化なし'
                }</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
