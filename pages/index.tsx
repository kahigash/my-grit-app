import { useEffect, useState } from 'react';

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([
    'まず、あなたの目標について教えてください。'
  ]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (!currentAnswer.trim()) return; // 空回答防止
    setIsLoading(true);

    const previousAnswers = questions.map((q, i) =>
      i === currentQuestionIndex ? currentAnswer : ''
    );

    try {
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                'あなたは面接官です。GRIT（やり抜く力）を測るための深掘りインタビューを行います。質問は1つずつ行ってください。',
            },
            ...previousAnswers
              .filter(a => a)
              .map((answer, i) => [
                { role: 'user', content: questions[i] },
                { role: 'assistant', content: answer },
              ])
              .flat(),
            {
              role: 'user',
              content: '次の質問をお願いします。',
            },
          ],
        }),
      });

      const data = await res.json();
      const nextQuestion = data.result || '次の質問を取得できませんでした。';
      setQuestions([...questions, nextQuestion]);
      setCurrentAnswer('');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } catch (err) {
      console.error('エラー:', err);
      alert('質問の取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>GRIT測定インタビュー</h1>
      {questions.map((q, i) => (
        <div key={i} style={{ marginBottom: '1.5rem' }}>
          <p>
            <strong>Q{i + 1}:</strong> {q}
          </p>
          {i === currentQuestionIndex && (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="回答を入力してください"
              rows={4}
              style={{
                width: '100%',
                maxWidth: '600px',
                padding: '0.5rem',
                fontSize: '1rem',
              }}
            />
          )}
        </div>
      ))}
      <button
        onClick={handleNext}
        disabled={isLoading}
        style={{
          padding: '0.5rem 1.5rem',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        {isLoading ? '送信中...' : '次の質問へ'}
      </button>
    </div>
  );
}
