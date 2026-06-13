import { callClaude } from '../ai/claude';
import { callOpenAI } from '../ai/openai';
import { sanitizeThreatData } from '../security/sanitize';
import type { AnalyzeRequest, AIAnalysisResult } from '../validators/aiSchemas';

export async function analyzeThreat(request: AnalyzeRequest): Promise<AIAnalysisResult> {
  const sanitized = sanitizeThreatData({
    appName: request.threatData.appName,
    description: request.threatData.description,
    permissions: request.threatData.permissions,
  });

  const userPayload = JSON.stringify({
    eventType: request.threatData.eventType,
    riskLevel: request.threatData.riskLevel,
    appName: sanitized.appName,
    description: sanitized.description,
    permissions: sanitized.permissions,
    timestamp: request.threatData.timestamp,
    analysisDepth: request.analysisDepth,
  });

  // Primary provider, then fallback
  try {
    return await callClaude(userPayload);
  } catch (primaryErr) {
    if (!process.env.OPENAI_API_KEY) throw primaryErr;
    return await callOpenAI(userPayload);
  }
}
