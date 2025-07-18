import { useEffect, useState } from 'react';

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 初期質問を1問だけ固定で表示
  useEffect(() => {
    setQuestions([
      'これまでに、どうしてもやり遂げたいと思って粘り強く取り組んだ長期的な目標やプロジェクトがあれば教えてください。その際に直面した最も大きな困難と、それをどう乗り越えたかを詳しく聞かせてください。'
    ]);
    setAnswers(['']);
  }, []);

  const handleNext = async () => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = currentAnswer;

    const messages = questions.map((q, i) => ({
      role: 'user',
      content: `Q${i + 1}: ${q}\nA: ${updatedAnswers[i] ?? ''}`,
    }));

    try {
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (data.result) {
        setQuestions([...questions, data.result.trim()]);
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
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>GRIT測定インタビュー</h1>

      {questions.map((q, i) => (
        <div key={i} style={{ marginBottom: '2rem' }}>
          <p><strong>Q{i + 1}:</strong> {q}</p>

          {i < currentQuestionIndex && (
            <>
              <p><strong>A:</strong> {answers[i]}</p>
            </>
         
