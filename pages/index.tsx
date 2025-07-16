const handleNext = async () => {
  if (showResult || questions.length >= 5) return;

  const updatedAnswers = [...answers];
  updatedAnswers[currentQuestionIndex] = currentAnswer;
  setAnswers(updatedAnswers);

  if (questions.length >= 5 - 1) {
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

  // 必ず質問と回答が同数になるように作る
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
