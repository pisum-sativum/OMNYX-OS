import { AIResponseSchema, type AIAnalysisResult } from '../validators/aiSchemas';
import { SYSTEM_PROMPT } from './prompt';

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
}

export async function callOpenAI(userPayload: string): Promise<AIAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      max_tokens: 900,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this mobile threat event and return the JSON intelligence report:\n${userPayload}`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Provider error: ${response.status}`);

  const body = (await response.json()) as OpenAIResponse;
  const rawText = body.choices[0]?.message?.content ?? '';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in provider response');

  const parsed = JSON.parse(jsonMatch[0]) as unknown;
  return AIResponseSchema.parse(parsed);
}
