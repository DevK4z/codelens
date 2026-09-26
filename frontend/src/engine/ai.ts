export interface AIExplanationResult {
  overview: string;
  complexity: string;
  details: string;
}

export async function explainCodeWithAI(code: string, stdout: string, apiKey: string, signal?: AbortSignal): Promise<AIExplanationResult> {
  if (!apiKey) {
    throw new Error('Vui lòng nhập API Key của Google Gemini.');
  }

  const prompt = `Bạn là một chuyên gia lập trình C++ và cấu trúc dữ liệu thuật toán.
Hãy giải thích ngắn gọn đoạn code C++ sau đây cho học viên.
Trả về kết quả chuẩn bằng JSON với 3 trường:
1. "overview": Tổng quan thuật toán này làm gì (1-2 câu).
2. "complexity": Độ phức tạp thời gian và không gian (vd: O(N), O(1)).
3. "details": Giải thích chi tiết các bước chính yếu của thuật toán và kết quả in ra màn hình (stdout).

Code C++:
\`\`\`cpp
${code}
\`\`\`

Kết quả in ra màn hình (stdout):
\`\`\`
${stdout || '(Không có kết quả in ra)'}
\`\`\`

Chỉ trả về JSON thuần túy, không format markdown xung quanh.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              overview: { type: "string" },
              complexity: { type: "string" },
              details: { type: "string" }
            },
            required: ["overview", "complexity", "details"]
          },
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Lỗi kết nối đến Gemini API.');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API không trả về nội dung.');
    }

    const parsed = JSON.parse(text) as AIExplanationResult;
    if (!parsed.overview || !parsed.complexity || !parsed.details) {
      throw new Error('Phản hồi từ AI thiếu trường dữ liệu.');
    }
    return parsed;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Đã hủy yêu cầu hoặc quá thời gian chờ.');
    }
    throw new Error(error.message || 'Lỗi không xác định khi gọi AI.');
  }
}

