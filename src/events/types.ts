// Phase 4 - Realtime Intelligence event schema.
// All events (ambient, scan-derived, Supabase CDC) share this shape.
// SECURITY: no PII, no raw tokens, no unvalidated strings in this type.

export type AtmosphereLevel = 'calm' | 'elevated' | 'tense' | 'critical';

export type OmnyxEventType =
  | 'THREAT_DETECTED'
  | 'RISK_SCORE_CHANGE'
  | 'SURVEILLANCE_ANOMALY'
  | 'AI_ANALYSIS_COMPLETE'
  | 'MODE_TRANSITION'
  | 'SWARM_REACTION'
  | 'SCAN_COMPLETE'
  | 'AMBIENT_PULSE'
  | 'SYSTEM_STATE_CHANGE';

export type OmnyxEventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type OmnyxEventSource =
  | 'permission_scan'
  | 'ambient_engine'
  | 'supabase_realtime'
  | 'user_action'
  | 'swarm';

export type AgentId =
  | 'threat-agent'
  | 'network-agent'
  | 'privacy-coach'
  | 'automation-agent'
  | 'behavior-agent';

export interface UIReaction {
  atmosphereShift: 'escalate' | 'deescalate' | 'none';
  pulseIntensity: number;  // 0–100 - drives animation urgency in UI
  radarBurst: boolean;
  swarmAlert: boolean;
}

export interface OmnyxEvent {
  id: string;
  type: OmnyxEventType;
  timestamp: number;           // epoch ms
  severity: OmnyxEventSeverity;
  confidence: number;          // 0–100
  source: OmnyxEventSource;
  title: string;               // max 64 chars, sanitized
  description: string;         // max 128 chars, sanitized
  agentTargets: AgentId[];     // which agents should react
  uiReaction: UIReaction;
  payload: Record<string, string | number | boolean>; // flat, sanitized
}
