import { useState } from 'react';

export default function Home() {
  const [qaList, setQaList] = useState([
    { q: '最近取り組んでいることの中で、特に達成感を感じたエピソードはありますか？', a: '' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleChange = (idx: number, value: string) => {
    const newList = [...qaList];
    newList[idx].a = value;
    setQaList(newList);
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>GRIT測定インタビュー</h2>
      {qaList.map((item, idx) => (
        <div key={idx} style={{ marginBottom: '1.5rem' }}>
          <div><strong>Q{idx + 1}:</strong> {item.q}</div>
          <input
            type="text"
            value={item.a}
            onChange={(e) => handleChange(idx, e.target.value)}
            disabled={idx !== qaList.length - 1 || loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.5rem',
              backgroundColor: idx !== qaList.length - 1 ? '#eee' : 'white'
            }}
          />
        </div>
      ))}
      <button onClick={handleSubmit} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
        {loading ? 'AIが次の質問を考えています...' : '次の質問へ'}
      </button>
    </main>
  );
}
