// SECURITY - single trust boundary for all incoming event payloads.
// Every event (ambient, Supabase CDC, scan-derived) passes through here.
// Never trust the `source` field from external payloads - callers override it.

import type {
  OmnyxEvent,
  OmnyxEventType,
  OmnyxEventSeverity,
  OmnyxEventSource,
  AgentId,
  UIReaction,
} from './types';

const VALID_TYPES = new Set<OmnyxEventType>([
  'THREAT_DETECTED', 'RISK_SCORE_CHANGE', 'SURVEILLANCE_ANOMALY',
  'AI_ANALYSIS_COMPLETE', 'MODE_TRANSITION', 'SWARM_REACTION',
  'SCAN_COMPLETE', 'AMBIENT_PULSE', 'SYSTEM_STATE_CHANGE',
]);

const VALID_SEVERITIES = new Set<OmnyxEventSeverity>([
  'info', 'low', 'medium', 'high', 'critical',
]);

const VALID_SOURCES = new Set<OmnyxEventSource>([
  'permission_scan', 'ambient_engine', 'supabase_realtime', 'user_action', 'swarm',
]);

const VALID_AGENT_IDS = new Set<AgentId>([
  'threat-agent', 'network-agent', 'privacy-coach', 'automation-agent', 'behavior-agent',
]);

const VALID_ATMOSPHERE_SHIFTS = new Set(['escalate', 'deescalate', 'none']);

// Strips control chars, null bytes, HTML injection vectors
function sanitizeStr(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\x00-\x1F\x7F<>'"\\]/g, '').trim().slice(0, maxLen);
}

function clampNum(raw: unknown, min: number, max: number, fallback: number): number {
  if (typeof raw !== 'number' || !isFinite(raw)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(raw)));
}

export function validateOmnyxEvent(raw: unknown): OmnyxEvent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  if (!VALID_TYPES.has(r['type'] as OmnyxEventType)) return null;
  if (!VALID_SEVERITIES.has(r['severity'] as OmnyxEventSeverity)) return null;
  if (!VALID_SOURCES.has(r['source'] as OmnyxEventSource)) return null;

  // Filter agent targets to known-valid IDs only
  const agentTargets = (Array.isArray(r['agentTargets']) ? r['agentTargets'] : [])
    .filter((id): id is AgentId => VALID_AGENT_IDS.has(id as AgentId))
    .slice(0, 5);

  const rawUi = r['uiReaction'];
  const uiObj =
    rawUi && typeof rawUi === 'object' && !Array.isArray(rawUi)
      ? (rawUi as Record<string, unknown>)
      : {};

  const uiReaction: UIReaction = {
    atmosphereShift: VALID_ATMOSPHERE_SHIFTS.has(uiObj['atmosphereShift'] as string)
      ? (uiObj['atmosphereShift'] as UIReaction['atmosphereShift'])
      : 'none',
    pulseIntensity: clampNum(uiObj['pulseIntensity'], 0, 100, 20),
    radarBurst: !!uiObj['radarBurst'],
    swarmAlert: !!uiObj['swarmAlert'],
  };

  // Sanitize payload - flat key/value only, max 10 entries
  const rawPayload = r['payload'];
  const payload: Record<string, string | number | boolean> = {};
  if (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload)) {
    let count = 0;
    for (const [k, v] of Object.entries(rawPayload as Record<string, unknown>)) {
      if (count >= 10) break;
      const key = sanitizeStr(k, 32);
      if (!key) continue;
      if (typeof v === 'string') {
        payload[key] = sanitizeStr(v, 128);
        count++;
      } else if (typeof v === 'number' && isFinite(v)) {
        payload[key] = v;
        count++;
      } else if (typeof v === 'boolean') {
        payload[key] = v;
        count++;
      }
    }
  }

  return {
    id: sanitizeStr(r['id'], 64) || `ev_${Date.now()}`,
    type: r['type'] as OmnyxEventType,
    timestamp: clampNum(r['timestamp'], 0, Date.now() + 5000, Date.now()),
    severity: r['severity'] as OmnyxEventSeverity,
    confidence: clampNum(r['confidence'], 0, 100, 50),
    source: r['source'] as OmnyxEventSource,
    title: sanitizeStr(r['title'], 64),
    description: sanitizeStr(r['description'], 128),
    agentTargets,
    uiReaction,
    payload,
  };
}
