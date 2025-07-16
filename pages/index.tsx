import { useEffect, useState } from 'react';

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 最初の質問を固定
  useEffect(() => {
    setQuestions(['あなたが最近やり抜いた経験について教えてください。']);
  }, []);

  const handleNext = async () => {
    const newAnswers = [...questions.map((_, i) => i === currentQuestionIndex ? currentAnswer : '')];
    const messages = [
      { role: 'system', content: 'あなたはGRITを測定するためのインタビュアーです。' },
      ...newAnswers.map((answer, index) => ({
        role: 'user',
        content: `Q${index + 1}: ${questions[index]}\nA: ${answer}`,
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
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer('');
        setError(null);
      } else {
        setError('次の質問を取得できませんでした。');
      }
    } catch (err) {
      setError('質問の取得に失敗しました。');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>GRIT測定インタビュー</h1>
      {questions.map((q, i) => (
        <div key={i}>
          <p><strong>Q{i + 1}:</strong> {q}</p>
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
