import { useEffect, useState } from 'react';

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // 最初の質問を取得する
  useEffect(() => {
    const fetchInitialQuestion = async () => {
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousAnswers: [] }),
      });
      const data = await res.json();
      setQuestions([data.question]);
    };
    fetchInitialQuestion();
  }, []);

  const handleNext = async () => {
    const newAnswers = [...questions.map((_, i) => i === currentQuestionIndex ? currentAnswer : '')];
    const res = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previousAnswers: newAnswers }),
    });
    const data = await res.json();
    setQuestions([...questions, data.question]);
    setCurrentAnswer('');
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  return (
    <div>
      <h1>GRIT測定インタビュー</h1>
      {questions.map((q, i) => (
        <div key={i}>
          <p><strong>Q{i + 1}:</strong> {q}</p>
          {i === currentQuestionIndex && (
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="回答を入力してください"
            />
          )}
        </div>
      ))}
      <button onClick={handleNext}>次の質問へ</button>
    </div>
  );
}
