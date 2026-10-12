/**
 * Gemini API utility — server-side only.
 * Never import this from client components.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function callGemini(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}

export function parseGeminiJSON<T>(text: string): T {
  let stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Remove trailing commas which often break JSON.parse
  stripped = stripped.replace(/,\s*([\]}])/g, '$1');
  
  try { return JSON.parse(stripped); } catch { /* fallback */ }
  
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(stripped.substring(start, end + 1)); } catch { /* fallback */ }
  }
  
  throw new Error(`Could not parse AI response as JSON. Received: ${text.substring(0, 300)}...`);
}
