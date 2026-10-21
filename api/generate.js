export default async function handler(req, res) {
  // POST 요청 검증
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel 환경변수에서 키 가져오기
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel 환경변수에 GEMINI_API_KEY가 설정되지 않았습니다.' });
  }

  const { name, f1, f2, f3, target, platform, category, tone } = req.body || {};
  if (!name || !f1 || !f2 || !f3) {
    return res.status(400).json({ error: '필수 상품 정보가 누락되었습니다.' });
  }

  const prompt = `당신은 네이버 스마트스토어와 쿠팡 판매 전환율 1위의 전문 이커머스 카피라이터입니다.
아래 상품 정보를 바탕으로 반드시 순수 JSON 포맷으로만 응답해주세요. 마크다운 백틱(\`\`\`json)이나 기타 설명은 일절 생략하세요.

[상품 정보]
- 상품명: ${name}
- 핵심 스펙 1: ${f1}
- 핵심 스펙 2: ${f2}
- 핵심 스펙 3: ${f3}
- 타깃 고객: ${target || '해당 제품을 필요로 하는 고객'}
- 등록 플랫폼: ${platform}
- 카테고리: ${category}
- 톤앤매너: ${tone}

[필수 JSON 구조]:
{
  "headlines": [
    {"type": "A안 (문제 공감 & 충격 해결)", "text": "후킹 헤드라인"},
    {"type": "B안 (압도적 혜택 & 숫자 강조)", "text": "혜택 헤드라인"},
    {"type": "C안 (사회적 증거 & 필수품 유도)", "text": "사회적증거 헤드라인"}
  ],
  "bodyParagraphs": [
    {
      "section": "1. Attention (문제 제기 & 공감)",
      "heading": "소제목",
      "body": "공감 문장"
    },
    {
      "section": "2. Interest & Desire (비교불가 3대 특장점)",
      "heading": "특장점 소제목",
      "bullets": ["✓ POINT 01 : ...", "✓ POINT 02 : ...", "✓ POINT 03 : ..."],
      "body": "신뢰 문장"
    },
    {
      "section": "3. Action (안심 구매 & 빠른 출고)",
      "heading": "클로징 소제목",
      "body": "행동 유도 문장"
    }
  ],
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5", "태그6", "태그7", "태그8", "태그9", "태그10"],
  "coupangTitle": "쿠팡 50자 상품명"
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(candidateText);
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
