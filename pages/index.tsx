import { useEffect, useState } from 'react';

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuestions(['あなたが最近やり抜いた経験について教えてください。']);
    setAnswers(['']);
  }, []);

  const handleNext = async () => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(updatedAnswers);

    const messages = [
      {
        role: 'system',
        content: `あなたは企業の採用面接におけるインタビュアーです。
候補者のGRIT（やり抜く力）を間接的に測定してください。
回答に共感や理解を示したうえで、次の質問を1つ、日本語で出してください。`,
      },
      ...questions.map((q, i) => ({
        role: 'user',
        content: `Q${i + 1}: ${q}\nA: ${updatedAnswers[i] ?? ''}`,
      })),
      { role: 'user', content: '次の質問をお願いします。' },
    ];

    try {
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (data.result) {
        setQuestions([...questions, data.result]);
        setAnswers([...updatedAnswers, '']);
        setCurrentAnswer('');
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setError(null);
      } else {
        setError('次の質問を取得できませんでした。');
      }
    } catch {
      setError('質問の取得に失敗しました。');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>GRIT測定インタビュー</h1>
      {questions.map((q, i) => (
        <div key={i} style={{ marginBottom: '1.5rem' }}>
          <p><strong>Q{i + 1}:</strong> {q}</p>
          {i < currentQuestionIndex && (
            <p><strong>A:</strong> {answers[i]}</p>
          )}
          {i === currentQuestionIndex && (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="回答を入力してください"
              rows={4}
              style={{ width: '100%', maxWidth: '600px' }}
            />
          )}
        </div>
      ))}
      <button onClick={handleNext}>次の質問へ</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
