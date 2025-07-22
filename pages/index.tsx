""import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

// 型定義
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Score {
  perseverance: number;
  passion: number;
  goal_orientation: number;
  resilience: number;
}

interface ScoreLog {
  answer: string;
  relatedFactors: string[];
  score: Score;
}

const MAX_QUESTIONS = 5;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [score, setScore] = useState<Score>({
    perseverance: 0,
    passion: 0,
    goal_orientation: 0,
    resilience: 0,
  });
  const [scoreLogs, setScoreLogs] = useState<ScoreLog[]>([]);
  const [showInput, setShowInput] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            '質問 1 / 5 これまでに、どうしてもやり遂げたいと思って粘り強く取り組んだ長期的な目標やプロジェクトがあれば教えてください。その際に直面した最も大きな困難と、それをどう乗り越えたかを詳しく聞かせてください。',
        },
      ]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    const questionRes = await axios.post('/api/generate-question', {
      messages: newMessages,
      questionCount: currentQuestion,
    });

    const assistantMessage: Message = {
      role: 'assistant',
      content: questionRes.data.message,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    const scoreRes = await axios.post('/api/evaluate-grit', {
      messages: newMessages,
    });

    const thisScore = scoreRes.data.score as Score;
    const relatedFactors = scoreRes.data.relatedFactors as string[];

    setScore((prev) => ({
      perseverance: prev.perseverance + thisScore.perseverance,
      passion: prev.passion + thisScore.passion,
      goal_orientation: prev.goal_orientation + thisScore.goal_orientation,
      resilience: prev.resilience + thisScore.resilience,
    }));

    setScoreLogs((prev) => [
      ...prev,
      {
        answer: input,
        relatedFactors,
        score: thisScore,
      },
    ]);

    const nextQuestion = currentQuestion + 1;
    setCurrentQuestion(nextQuestion);

    if (nextQuestion > MAX_QUESTIONS) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'ご協力ありがとうございました。これでインタビューは終了です。お疲れ様でした。',
        },
      ]);
      setShowInput(false);
    }
  };

  const formatAverage = (value: number) =>
    scoreLogs.length === 0 ? '0.0' : (value / scoreLogs.length).toFixed(1);

  return (
    <div style={{ display: 'flex', padding: 20 }}>
      <div style={{ flex: 2, marginRight: 20 }}>
        <h2>GRIT測定インタビュー</h2>
        <div style={{ border: '1px solid #ccc', padding: 10, minHeight: 300 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                textAlign: msg.role === 'user' ? 'right' : 'left',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: msg.role === 'user' ? '#dcf8c6' : '#f1f0f0',
                  borderRadius: 10,
                  padding: '8px 12px',
                  maxWidth: '80%',
                }}
              >
                <strong>{msg.role === 'user' ? 'あなた' : 'システム'}:</strong>{' '}
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {showInput && (
          <div style={{ marginTop: 10 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              style={{ width: '100%' }}
              placeholder="ここに回答を入力してください"
            />
            <button onClick={handleSend} style={{ marginTop: 5 }}>
              送信
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h3>現在のGRITスコア（平均）</h3>
        <ul>
          <li>粘り強さ: {formatAverage(score.perseverance)} / 5</li>
          <li>情熱: {formatAverage(score.passion)} / 5</li>
          <li>目標志向性: {formatAverage(score.goal_orientation)} / 5</li>
          <li>回復力: {formatAverage(score.resilience)} / 5</li>
        </ul>

        <h4>スコア変動履歴</h4>
        <ol>
          {scoreLogs.map((log, idx) => (
            <li key={idx} style={{ marginBottom: 10 }}>
              <div>回答 {idx + 1}: 「{log.answer.slice(0, 30)}...」</div>
              <div>
                影響要素:{' '}
                {log.relatedFactors && log.relatedFactors.length > 0
                  ? log.relatedFactors.join(', ')
                  : 'なし'}
              </div>
              <div>
                Δ: 粘り強さ: {log.score.perseverance}, 情熱:{' '}
                {log.score.passion}, 目標志向性:{' '}
                {log.score.goal_orientation}, 回復力:{' '}
                {log.score.resilience}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
