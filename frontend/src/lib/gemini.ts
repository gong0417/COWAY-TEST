const MODEL = "gemini-2.0-flash";

export async function summarizeWithGemini(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("VITE_GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `다음 내용을 한국어로 간결하게 요약해 주세요 (불릿 3~5개).\n\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API 오류 (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini 응답에 텍스트가 없습니다.");
  return text.trim();
}
