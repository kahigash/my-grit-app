import { useEffect, useState } from 'react';

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([
    'これまでに何かをやり遂げた経験を教えてください。',
  ]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const callApi = async (answers: string[]) => {
    const messages = [
      {
        role: 'system',
        content: 'あなたはGRITインタビュアーです。前の回答に基づいて、次の深掘り質問を1つだけ日本語で出してください。',
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

  const handleNext = async () => {
    const newAnswers = [...answers, currentAnswer];

    let nextQuestion = '';
    if (currentQuestionIndex >= 0) {
      nextQuestion = await callApi(newAnswers);
    }

    setAnswers(newAnswers);
    if (nextQuestion) setQuestions([...questions, nextQuestion]);
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
