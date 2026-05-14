import { z } from 'zod';

export const THREAT_TYPES = [
  'microphone_access', 'camera_access', 'clipboard_read', 'location_access',
  'network_request', 'tracker_detected', 'suspicious_permission', 'background_activity',
] as const;

export const RISK_LEVELS = ['critical', 'high', 'medium', 'low', 'safe'] as const;

export const AGENT_NAMES = [
  'SENTINEL', 'SCOUT', 'ANALYST', 'ORACLE', 'PHANTOM',
] as const;

export const THREAT_CATEGORIES = [
  'surveillance', 'data_theft', 'tracker', 'anomaly',
  'permission_abuse', 'network', 'behavioral',
] as const;

const UNSAFE_PATTERN = /(http|www\.|\.com|<|>|```|\$\{)/i;
const clean = (field: string) => (s: string) => {
  if (UNSAFE_PATTERN.test(s)) throw new Error(`Unsafe content in ${field}`);
  return s;
};

export const AnalyzeRequestSchema = z.object({
  deviceId: z.string()
    .min(8).max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid device ID format'),
  threatData: z.object({
    appName: z.string().min(1).max(80).transform(s => s.replace(/[<>"'`\\]/g, '')),
    eventType: z.enum(THREAT_TYPES),
    riskLevel: z.enum(RISK_LEVELS),
    description: z.string().min(1).max(400).transform(s => s.replace(/[<>"'`\\]/g, '')),
    permissions: z.array(
      z.string().max(60).regex(/^[A-Za-z_.]+$/)
    ).max(20).default([]),
    timestamp: z.string().datetime(),
  }),
  analysisDepth: z.enum(['quick', 'deep']).default('quick'),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const AIResponseSchema = z.object({
  summary: z.string().min(10).max(180).refine(clean('summary')),
  explanation: z.string().min(20).max(520).refine(clean('explanation')),
  severityReason: z.string().min(10).max(300).refine(clean('severityReason')),
  behavioralObservations: z.array(
    z.string().min(10).max(130).refine(clean('behavioralObservations'))
  ).min(2).max(3),
  recommendedAction: z.string().min(10).max(200).refine(clean('recommendedAction')),
  confidence: z.number().min(0).max(1),
  agentInsights: z.array(z.object({
    agent: z.enum(AGENT_NAMES),
    insight: z.string().min(10).max(160).refine(clean('insight')),
  })).min(2).max(5),
  threatCategory: z.enum(THREAT_CATEGORIES),
});

export type AIAnalysisResult = z.infer<typeof AIResponseSchema>;

export const ClientResponseSchema = z.object({
  success: z.literal(true),
  data: AIResponseSchema,
  requestId: z.string(),
});
