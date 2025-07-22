const prompt = `
あなたはGRIT評価の専門家です。
以下の「ユーザーの回答」について、次の4つの構成要素にそれぞれどの程度関連しているかを**絶対評価**してください：

- perseverance（粘り強さ）
- passion（情熱）
- goal_orientation（目標志向性）
- resilience（回復力）

ルール：
- 各スコアは **0〜5の整数**。他の回答との比較は一切行わない。
- スコアが低くても **マイナスには絶対にしないこと（0〜5のみ）**。
- **関連があれば0より大きいスコアを、なければ0とする。**
- 各スコアの理由説明は不要。出力は以下のJSON形式で返してください：

{
  "score": {
    "perseverance": 数値（0〜5）,
    "passion": 数値（0〜5）,
    "goal_orientation": 数値（0〜5）,
    "resilience": 数値（0〜5）
  },
  "relatedFactors": ["perseverance", "goal_orientation", ...]
}

ユーザーの回答:
${lastAnswer}
`;
