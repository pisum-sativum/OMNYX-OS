// The autonomous intelligence heartbeat of OMNYX.
// Generates synthetic threat events at organic intervals, making the app feel
// alive even with no network and no active permission scan.
//
// SECURITY:
// - All generated events pass through validateOmnyxEvent (defense in depth).
// - AppState listener pauses generation when app is backgrounded (battery + security).
// - Uses setTimeout (not setInterval) so timing is genuinely variable.
// - Never logs event content.

import { AppState, type AppStateStatus } from 'react-native';
import { validateOmnyxEvent } from '@/events/eventValidator';
import type { OmnyxEvent, AtmosphereLevel, OmnyxEventType, OmnyxEventSeverity, AgentId } from '@/events/types';

function genId(): string {
  return `amb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Interval range (ms) per atmosphere level - organic, not mechanical
const INTERVALS: Record<AtmosphereLevel, [number, number]> = {
  calm:     [9000, 16000],
  elevated: [4500, 8500],
  tense:    [2000, 4500],
  critical: [900,  2200],
};

interface EventTemplate {
  type: OmnyxEventType;
  severity: OmnyxEventSeverity;
  titles: readonly string[];
  descriptions: readonly string[];
  agentTargets: AgentId[];
  uiReaction: {
    atmosphereShift: 'escalate' | 'deescalate' | 'none';
    pulseIntensity: number;
    radarBurst: boolean;
    swarmAlert: boolean;
  };
}

const TEMPLATES: Record<AtmosphereLevel, EventTemplate[]> = {
  calm: [
    {
      type: 'AMBIENT_PULSE',
      severity: 'info',
      titles: ['Baseline scan complete', 'System nominal', 'Network traffic clean', 'No anomalies detected'],
      descriptions: [
        'All agents operating within normal parameters.',
        'Privacy surface stable. No suspicious activity.',
        '47 apps monitored, behavioral baselines holding.',
      ],
      agentTargets: [],
      uiReaction: { atmosphereShift: 'none', pulseIntensity: 10, radarBurst: false, swarmAlert: false },
    },
    {
      type: 'AI_ANALYSIS_COMPLETE',
      severity: 'info',
      titles: ['Behavior Agent: Baseline updated', 'Network Agent: Traffic nominal', 'Privacy Coach: All clear'],
      descriptions: [
        'Behavioral model updated with 24-hour data set.',
        'Outbound connections match expected app profiles.',
        'Privacy posture holding steady. Risk score stable.',
      ],
      agentTargets: ['behavior-agent', 'privacy-coach'],
      uiReaction: { atmosphereShift: 'none', pulseIntensity: 15, radarBurst: false, swarmAlert: false },
    },
  ],

  elevated: [
    {
      type: 'SURVEILLANCE_ANOMALY',
      severity: 'low',
      titles: [
        'Background activity spike detected',
        'Unusual wake-lock acquisition pattern',
        'Elevated API polling frequency',
        'Silent push notification pattern',
      ],
      descriptions: [
        'App acquiring wake-locks at unusually high frequency.',
        'Background service active outside expected operational window.',
        'API polling rate 3x above documented specification.',
        'High-frequency silent pushes keeping app process alive.',
      ],
      agentTargets: ['behavior-agent'],
      uiReaction: { atmosphereShift: 'none', pulseIntensity: 30, radarBurst: false, swarmAlert: true },
    },
    {
      type: 'RISK_SCORE_CHANGE',
      severity: 'low',
      titles: [
        'Risk vector signature updated',
        'Tracker SDK identified in 2 apps',
        'Permission profile shift detected',
      ],
      descriptions: [
        'New ad-network SDK fingerprint added to threat database.',
        'Cross-app tracking signature present in recently updated apps.',
        'Permission grant pattern changed since last baseline scan.',
      ],
      agentTargets: ['privacy-coach', 'network-agent'],
      uiReaction: { atmosphereShift: 'none', pulseIntensity: 28, radarBurst: false, swarmAlert: false },
    },
  ],

  tense: [
    {
      type: 'THREAT_DETECTED',
      severity: 'medium',
      titles: [
        'Clipboard access without user interaction',
        'Background location polling detected',
        'Microphone warm-up event logged',
        'Foreground service anomaly',
      ],
      descriptions: [
        'App read clipboard content without active user session.',
        'Location accessed 12+ times while app was backgrounded.',
        'Microphone briefly activated outside any active use session.',
        'Foreground service running with no visible user context.',
      ],
      agentTargets: ['threat-agent', 'behavior-agent'],
      uiReaction: { atmosphereShift: 'escalate', pulseIntensity: 55, radarBurst: true, swarmAlert: true },
    },
    {
      type: 'SURVEILLANCE_ANOMALY',
      severity: 'medium',
      titles: [
        'Cross-app data bridge detected',
        'SDK data sharing across 3 apps',
        'Behavioral profile construction in progress',
      ],
      descriptions: [
        'Multiple apps sharing behavioral data via common SDK channel.',
        'Cross-application profile being constructed without consent.',
        'Three apps coordinating data collection through shared library.',
      ],
      agentTargets: ['network-agent', 'behavior-agent'],
      uiReaction: { atmosphereShift: 'escalate', pulseIntensity: 52, radarBurst: true, swarmAlert: true },
    },
  ],

  critical: [
    {
      type: 'THREAT_DETECTED',
      severity: 'high',
      titles: [
        'Accessibility service exploitation attempt',
        'SMS harvesting pattern active',
        'Overlay attack surface detected',
        'Device admin escalation attempt',
      ],
      descriptions: [
        'App binding accessibility service without declared functionality.',
        'SMS read pattern is consistent with OTP interception behavior.',
        'SYSTEM_ALERT_WINDOW overlay active - possible screen content scraping.',
        'App requesting elevated system permissions outside normal flow.',
      ],
      agentTargets: ['threat-agent', 'automation-agent', 'network-agent'],
      uiReaction: { atmosphereShift: 'escalate', pulseIntensity: 80, radarBurst: true, swarmAlert: true },
    },
    {
      type: 'THREAT_DETECTED',
      severity: 'critical',
      titles: [
        'CRITICAL: Financial fraud signature confirmed',
        'CRITICAL: Stalkerware behavioral profile matched',
        'CRITICAL: Device hijack risk - accessibility + overlay',
      ],
      descriptions: [
        'READ_SMS + ACCESSIBILITY_SERVICE combination matches financial fraud taxonomy.',
        'Background location + microphone + contacts matches documented stalkerware signature.',
        'BIND_ACCESSIBILITY_SERVICE + SYSTEM_ALERT_WINDOW active simultaneously.',
      ],
      agentTargets: ['threat-agent', 'automation-agent', 'network-agent', 'privacy-coach'],
      uiReaction: { atmosphereShift: 'escalate', pulseIntensity: 100, radarBurst: true, swarmAlert: true },
    },
  ],
};

type EventCallback = (event: OmnyxEvent) => void;

class AmbientEngine {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private level: AtmosphereLevel = 'calm';
  private callback: EventCallback | null = null;
  private running = false;
  private appActive = true;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  start(onEvent: EventCallback): void {
    if (this.running) return;
    this.callback = onEvent;
    this.running = true;
    this.appStateSubscription = AppState.addEventListener('change', this.onAppStateChange);
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
    this.callback = null;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
  }

  setAtmosphere(level: AtmosphereLevel): void {
    this.level = level;
  }

  private onAppStateChange = (nextState: AppStateStatus): void => {
    const wasActive = this.appActive;
    this.appActive = nextState === 'active';
    if (!wasActive && this.appActive && this.running && !this.timerId) {
      this.scheduleNext();
    } else if (!this.appActive && this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  };

  private scheduleNext(): void {
    if (!this.appActive) return;
    const [min, max] = INTERVALS[this.level];
    const delay = rnd(min, max);
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.emitEvent();
      if (this.running) this.scheduleNext();
    }, delay);
  }

  private emitEvent(): void {
    if (!this.callback) return;
    const template = pick(TEMPLATES[this.level]);
    const raw = {
      id: genId(),
      type: template.type,
      timestamp: Date.now(),
      severity: template.severity,
      confidence: rnd(72, 96),
      source: 'ambient_engine' as const,
      title: pick(template.titles),
      description: pick(template.descriptions),
      agentTargets: template.agentTargets,
      uiReaction: template.uiReaction,
      payload: {},
    };
    const event = validateOmnyxEvent(raw);
    if (event) this.callback(event);
  }
}

export const ambientEngine = new AmbientEngine();
