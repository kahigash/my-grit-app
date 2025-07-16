import React, { useState } from "react";

const questions = [
  "最近ハマっていることや、続けている趣味はありますか？",
  "それはどのくらい続いていますか？",
  "始めたきっかけや、やっていて得られたことはありますか？"
];

const App = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const updated = [...answers];
    updated[step] = e.target.value;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // ダミーのGRIT評価ロジック
      const text = answers.join(" ").toLowerCase();
      const hasEffort = text.includes("続け") || text.includes("努力");
      const hasInsight = text.includes("得た") || text.includes("変化");
      const gritScore = {
        passion: hasInsight ? 4.5 : 3.0,
        perseverance: hasEffort ? 4.0 : 2.5,
      };
      setResult(gritScore);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>GRIT測定モック</h1>
      {result ? (
        <div>
          <h2>結果</h2>
          <p>情熱 (Passion)：{result.passion} / 5</p>
          <p>粘り強さ (Perseverance)：{result.perseverance} / 5</p>
        </div>
      ) : (
        <div>
          <h2>Q{step + 1}: {questions[step]}</h2>
          <textarea
            rows="4"
            cols="50"
            value={answers[step]}
            onChange={handleChange}
          />
          <br />
          <button onClick={handleNext}>次へ</button>
        </div>
      )}
    </div>
  );
};

export default App;