import { useEffect, useState } from 'react';

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const callApi = async (answers: string[]) => {
    const messages = [
      {
        role: 'system',
        content: 'あなたはGRITインタビュアーです。回答に基づいて次の質問を1つ出してください。',
      },
    ];

    answers.forEach((answer, i) => {
      messages.push({ role: 'user', content: `Q${i + 1}への回答: ${answer}` });
    });

    const res = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();
    return data.result;
  };

  useEffect(() => {
    (async () => {
      const firstQuestion = await callApi([]);
      setQuestions([firstQuestion]);
    })();
  }, []);

  const handleNext = async () => {
    const newAnswers = [...answers, currentAnswer];
    const nextQuestion = await callApi(newAnswers);

    setAnswers(newAnswers);
    setQuestions([...questions, nextQuestion]);
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
      <button onClick={handleNext} disabled={!currentAnswer.trim()}>
        次の質問へ
      </button>
    </div>
  );
}
