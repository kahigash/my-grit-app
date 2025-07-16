import { useEffect, useState } from 'react';

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // 初期質問の取得
  useEffect(() => {
    const fetchInitialQuestion = async () => {
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }), // Chat API 形式に合わせて空配列
      });
      const data = await res.json();
      setQuestions([data.question]);
    };
    fetchInitialQuestion();
  }, []);

  const handleNext = async () => {
    const newAnswers = [...answers, currentAnswer];

    // messages配列の構築（Chat API形式）
    const messages = questions.map((question, index) => {
      return [
        { role: 'system', content: question },
        { role: 'user', content: newAnswers[index] || '' }
      ];
    }).flat();

    const res = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();
    setQuestions([...questions, data.question]);
    setAnswers(newAnswers);
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
