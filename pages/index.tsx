import { useEffect, useState } from 'react';

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultText, setResultText] = useState('');

  useEffect(() => {
    setQuestions(['あなたが最近やり抜いた経験について教えてください。']);
    setAnswers(['']);
  }, []);

  const handleNext = async () => {
    if (showResult || questions.length >= 5) return;

    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(updatedAnswers);

    // 5問目なら診断へ
    if (questions.length >= 4) {
      setShowResult(true);
      try {
        const res = await fetch('/api/generate-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions, answers: updatedAnswers }),
        });
        const data = await res.json();
        setResultText(data.result || '診断結果を取得できませんでした。');
      } catch {
        setResultText('診断結果の取得に失敗しました。');
      }
      return;
    }

    // ここで messages を厳密に構成
    const messages = [
      { role: 'system', content: 'あなたはGRITを測定するためのインタビュアーです。' },
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
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer('');
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
      {showResult ? (
        <div>
          <h2>GRIT診断結果</h2>
          <p>{resultText}</p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
