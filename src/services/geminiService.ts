type Delivery = {
  id: string;
  customerName?: string;
  address?: string;
  status: string;
  priority?: string;
  scheduledTime?: string;
  routeOrder?: number;
  driverName?: string;
};

type RiskReport = {
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
  suggestions: string;
};

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

const buildPrompt = (deliveries: Delivery[]) => {
  const deliveryText = deliveries
    .map((d, index) => {
      return [
        `配送${index + 1}`,
        `ID: ${d.id}`,
        `顧客名: ${d.customerName || '不明'}`,
        `住所: ${d.address || '不明'}`,
        `ステータス: ${d.status || '不明'}`,
        `優先度: ${d.priority || '不明'}`,
        `予定時刻: ${d.scheduledTime || '不明'}`,
        `配送順: ${d.routeOrder ?? '不明'}`,
        `担当: ${d.driverName || '未割当'}`,
      ].join('\n');
    })
    .join('\n\n');

  return `
あなたは物流会社向け配送管理システムのAI分析アシスタントです。
以下の配送データをもとに、配送遅延リスクを分析してください。

【分析の観点】
- 未対応の件数が多いか
- 配送中の件数が多いか
- 優先度「高」が残っているか
- 再配達があるか
- 担当者ごとの件数に偏りがあるか
- 配送順と予定時刻に無理がありそうか

【出力ルール】
必ず次の3行だけで返してください。
説明文、前置き、補足、コードブロックは禁止です。

RISK_LEVEL: high または medium または low
REASON: 日本語で簡潔に理由
SUGGESTIONS: 日本語で具体的な対応策

【配送データ】
${deliveryText}
`;
};

const parseLineResponse = (text: string): RiskReport => {
  const cleaned = text
    .replace(/```/g, '')
    .replace(/^\s+|\s+$/g, '');

  const riskMatch = cleaned.match(/RISK_LEVEL\s*:\s*(high|medium|low)/i);
  const reasonMatch = cleaned.match(/REASON\s*:\s*([\s\S]*?)(\n|$)/i);
  const suggestionsMatch = cleaned.match(/SUGGESTIONS\s*:\s*([\s\S]*?)(\n|$)/i);

  const riskLevel = (riskMatch?.[1]?.toLowerCase() as 'high' | 'medium' | 'low') || 'low';
  const reason = reasonMatch?.[1]?.trim() || '';
  const suggestions = suggestionsMatch?.[1]?.trim() || '';

  // 理由や提案が十分に取れていないなら、安全側に倒す
  if (reason.length < 3 || suggestions.length < 3) {
    return {
      riskLevel: 'low',
      reason: '大きな遅延リスクは見つかりませんでした。',
      suggestions: '通常どおり配送を進めてください。',
    };
  }

  return {
    riskLevel,
    reason,
    suggestions,
  };
};
export const analyzeDelayRisk = async (
  deliveries: Delivery[]
): Promise<RiskReport> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。.env を確認してください。');
  }

  if (!deliveries || deliveries.length === 0) {
    throw new Error('配送データがありません。');
  }

  const prompt = buildPrompt(deliveries);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 20,
          maxOutputTokens: 300,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini APIエラー: ${errorText}`);
  }

  const data = await response.json();
  console.log('Gemini raw response:', data);

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  if (!text) {
    throw new Error('Geminiから有効な応答が返ってきませんでした。');
  }

  return parseLineResponse(text);
};