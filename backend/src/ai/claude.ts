import Anthropic from '@anthropic-ai/sdk';
import { AIResponseSchema, type AIAnalysisResult } from '../validators/aiSchemas';
import { SYSTEM_PROMPT } from './prompt';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude(userPayload: string): Promise<AIAnalysisResult> {
  const message = await client.messages.create({
    model: process.env.LLM_MODEL ?? 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this mobile threat event and return the JSON intelligence report:\n${userPayload}`,
      },
    ],
  });

  const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in provider response');

  const parsed = JSON.parse(jsonMatch[0]) as unknown;
  return AIResponseSchema.parse(parsed);
}
