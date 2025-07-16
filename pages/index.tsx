import { useState } from 'react';

export default function Home() {
  const [qaList, setQaList] = useState([
    { q: '最近継続して取り組んでいる活動や習慣はありますか？', a: '' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const last = qaList[qaList.length - 1];
    if (!last.a.trim()) return;

    setLoading(true);

    const res = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: qaList })
    });

    const data = await res.json();
    const nextQ = data.question;

    setQaList([...qaList, { q: nextQ, a: '' }]);
    setLoading(false);
  };

  const handleChange = (idx, value) => {
    const newList = [...qaList];
    newList[idx].a = value;
    setQaList(newList);
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h2>GRIT測定インタビュー</h2>
      {qaList.map((item, idx) => (
        <div key={idx} style={{ marginBottom: '1.5rem' }}>
          <div><strong>Q{idx + 1}:</strong> {item.q}</div>
          <input
            type="text"
            value={item.a}
            onChange={(e) => handleChange(idx, e.target.value)}
            disabled={idx !== qaList.length - 1}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
        </div>
      ))}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'AIが次の質問を考えています...' : '次の質問へ'}
      </button>
    </main>
  );
}
