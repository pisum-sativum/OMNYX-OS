import { z } from 'zod';

export const THREAT_TYPES = [
  'microphone_access', 'camera_access', 'clipboard_read', 'location_access',
  'network_request', 'tracker_detected', 'suspicious_permission', 'background_activity',
] as const;

export const RISK_LEVELS = ['critical', 'high', 'medium', 'low', 'safe'] as const;
export const AGENT_NAMES = ['SENTINEL', 'SCOUT', 'ANALYST', 'GUARDIAN', 'WATCHER'] as const;
export const THREAT_CATEGORIES = [
  'surveillance', 'data_theft', 'tracker', 'anomaly',
  'permission_abuse', 'network', 'behavioral',
] as const;

// Request validation - strict limits on all user-supplied strings
export const AnalyzeRequestSchema = z.object({
  deviceId: z.string()
    .min(8).max(128)
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Invalid device ID format'),
  threatData: z.object({
    appName: z.string().min(1).max(80).transform(s => s.replace(/[<>"'`\\]/g, '')),
    eventType: z.enum(THREAT_TYPES),
    riskLevel: z.enum(RISK_LEVELS),
    description: z.string().min(1).max(400).transform(s => s.replace(/[<>"'`\\]/g, '')),
    permissions: z.array(
      z.string().max(60).regex(/^[A-Z_a-z.]+$/)
    ).max(20).default([]),
    timestamp: z.string().datetime(),
  }),
  analysisDepth: z.enum(['quick', 'deep']).default('quick'),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// AI response validation - strict schema, no free-form
export const AIResponseSchema = z.object({
  summary: z.string().min(10).max(180)
    .refine(s => !/(http|www\.|\.com|<|>|```|\$\{)/i.test(s), 'Contains unsafe content'),
  explanation: z.string().min(20).max(520)
    .refine(s => !/(http|www\.|\.com|<|>|```|\$\{)/i.test(s), 'Contains unsafe content'),
  severityReason: z.string().min(10).max(300)
    .refine(s => !/(http|www\.|\.com|<|>|```|\$\{)/i.test(s), 'Contains unsafe content'),
  recommendedAction: z.string().min(10).max(200)
    .refine(s => !/(http|www\.|\.com|<|>|```|\$\{)/i.test(s), 'Contains unsafe content'),
  confidence: z.number().min(0).max(1),
  agentInsights: z.array(z.object({
    agent: z.enum(AGENT_NAMES),
    insight: z.string().min(10).max(160)
      .refine(s => !/(http|www\.|\.com|<|>|```|\$\{)/i.test(s), 'Contains unsafe content'),
  })).min(2).max(4),
  threatCategory: z.enum(THREAT_CATEGORIES),
});

export type AIAnalysisResult = z.infer<typeof AIResponseSchema>;

// Client response envelope
export const ClientResponseSchema = z.object({
  success: z.literal(true),
  data: AIResponseSchema,
  requestId: z.string(),
  cachedAt: z.string().datetime().optional(),
});
