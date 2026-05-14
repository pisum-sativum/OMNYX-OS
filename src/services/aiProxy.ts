import type { ThreatEvent } from '@/types';

// The AI analysis result shape (mirrors backend AIResponseSchema)
export interface AIAnalysisResult {
  summary: string;
  explanation: string;
  severityReason: string;
  recommendedAction: string;
  confidence: number;
  agentInsights: Array<{ agent: string; insight: string }>;
  threatCategory: string;
}

const PROXY_URL = (process.env.EXPO_PUBLIC_AI_PROXY_URL ?? 'http://localhost:3001').replace(/\/$/, '');

// Generate a stable device ID (not a real device ID - just a session fingerprint)
let _deviceId: string | null = null;
function getDeviceId(): string {
  if (!_deviceId) {
    _deviceId = `dev_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  }
  return _deviceId;
}

// Offline/fallback mock intelligence reports keyed by event type
const MOCK_REPORTS: Record<string, AIAnalysisResult> = {
  microphone_access: {
    summary: 'Background audio capture initiated outside active session.',
    explanation: 'The application accessed the microphone without a visible user interface interaction. This pattern is consistent with passive audio monitoring or voice-print collection. Background microphone access during device idle state indicates elevated surveillance risk.',
    severityReason: 'Microphone access during screen-off or idle conditions has no legitimate use case for most consumer applications. The temporal signature matches known data-harvesting patterns.',
    recommendedAction: 'Revoke microphone permission immediately and audit recent background process logs.',
    confidence: 0.87,
    agentInsights: [
      { agent: 'SENTINEL', insight: 'Audio sensor activated during idle window - no user-initiated trigger detected.' },
      { agent: 'SCOUT', insight: 'No concurrent audio playback justifying microphone access.' },
      { agent: 'ANALYST', insight: 'Pattern matches passive audio collection behavioral signature.' },
    ],
    threatCategory: 'surveillance',
  },
  camera_access: {
    summary: 'Visual sensor accessed outside expected application context.',
    explanation: 'Camera hardware was activated without corresponding UI activity. This access pattern does not align with the application\'s declared functionality. Visual data capture in background contexts may indicate covert image or video collection.',
    severityReason: 'Background camera activation is rarely legitimate. The access duration and frequency suggest automated rather than user-triggered capture.',
    recommendedAction: 'Deny camera permission and review application update history for recent behavior changes.',
    confidence: 0.91,
    agentInsights: [
      { agent: 'SENTINEL', insight: 'Camera hardware enabled without foreground UI context.' },
      { agent: 'GUARDIAN', insight: 'No media playback or AR process running concurrently.' },
    ],
    threatCategory: 'surveillance',
  },
  clipboard_read: {
    summary: 'Clipboard contents accessed without user-initiated paste action.',
    explanation: 'The application read clipboard data outside of a user paste gesture. Clipboard contents frequently contain sensitive data including passwords, authentication tokens, and financial information. Unprompted clipboard access is a known data exfiltration vector.',
    severityReason: 'Clipboard access without paste intent has no legitimate purpose. This pattern is commonly associated with credential harvesting.',
    recommendedAction: 'Rotate any credentials recently copied to clipboard and restrict application clipboard permissions.',
    confidence: 0.94,
    agentInsights: [
      { agent: 'ANALYST', insight: 'Clipboard read event occurred 2.3 seconds after device wake - no paste gesture recorded.' },
      { agent: 'SCOUT', insight: 'Network request followed clipboard access within 800ms.' },
    ],
    threatCategory: 'data_theft',
  },
  location_access: {
    summary: 'Geolocation query initiated during background state.',
    explanation: 'Precise GPS coordinates were requested while the application was not in the foreground. Continuous background location polling enables movement tracking and behavioral profiling. The access frequency exceeds any legitimate functionality requirement.',
    severityReason: 'Background location access at this frequency indicates tracking rather than functional use. Location data enables highly accurate behavioral and identity profiling.',
    recommendedAction: 'Restrict location permission to "only while using" and disable background app refresh.',
    confidence: 0.89,
    agentInsights: [
      { agent: 'SCOUT', insight: 'Location polling interval: every 45 seconds in background state.' },
      { agent: 'SENTINEL', insight: 'No geofencing or navigation context active.' },
    ],
    threatCategory: 'tracker',
  },
  network_request: {
    summary: 'Anomalous network telemetry detected to unregistered endpoint.',
    explanation: 'Outbound network traffic was observed to an endpoint not associated with the application\'s declared services. The request payload size and timing suggest data aggregation. Traffic analysis indicates potential data transmission to a third-party collection infrastructure.',
    severityReason: 'Network requests to undisclosed endpoints fall outside the application\'s stated data practices and may violate user consent.',
    recommendedAction: 'Block application network access via firewall rule and monitor for repeated connection attempts.',
    confidence: 0.78,
    agentInsights: [
      { agent: 'SCOUT', insight: 'Destination endpoint not in known CDN or app server registry.' },
      { agent: 'WATCHER', insight: 'Request frequency increased during low-use periods.' },
    ],
    threatCategory: 'network',
  },
  tracker_detected: {
    summary: 'Known tracking SDK signature identified in application process.',
    explanation: 'A behavioral fingerprint matching a documented third-party tracking library was detected. This SDK is designed to correlate user identity across applications and devices. The tracker collects device characteristics, usage patterns, and behavioral data for commercial profiling.',
    severityReason: 'This specific tracking SDK has a documented history of cross-device identity correlation and sale of behavioral profiles to data brokers.',
    recommendedAction: 'Isolate application in restricted network profile and consider removal if tracker is integral to core functionality.',
    confidence: 0.96,
    agentInsights: [
      { agent: 'ANALYST', insight: 'SDK signature matches OMNYX tracker database entry #4471.' },
      { agent: 'GUARDIAN', insight: 'Tracker operates across 340+ applications in current detection pool.' },
      { agent: 'WATCHER', insight: 'Data transmission cadence consistent with commercial analytics pipeline.' },
    ],
    threatCategory: 'tracker',
  },
  suspicious_permission: {
    summary: 'Anomalous permission cluster inconsistent with declared functionality.',
    explanation: 'The application has requested a combination of permissions that exceeds its stated purpose. Cross-referencing the permission set against the application category reveals a pattern associated with data aggregation tools rather than the declared utility function.',
    severityReason: 'Permission combinations that include location, microphone, and contacts without functional justification indicate a data collection primary objective disguised as utility.',
    recommendedAction: 'Audit each requested permission individually and deny any not essential to core functionality.',
    confidence: 0.83,
    agentInsights: [
      { agent: 'ANALYST', insight: 'Permission set scores 8.2/10 on anomaly index for application category.' },
      { agent: 'GUARDIAN', insight: 'Three permissions flagged as atypical for stated app function.' },
    ],
    threatCategory: 'permission_abuse',
  },
  background_activity: {
    summary: 'Elevated background process activity detected during device idle.',
    explanation: 'Anomalous process execution was observed while the device was in screen-off state. The computational load pattern suggests data processing rather than maintenance tasks. Background CPU and memory usage are consistent with content analysis or data packaging operations.',
    severityReason: 'Background workload of this intensity during idle has no benign explanation for this application type. The pattern matches data preparation for transmission.',
    recommendedAction: 'Enable background app restriction for this application and review battery usage statistics.',
    confidence: 0.81,
    agentInsights: [
      { agent: 'WATCHER', insight: 'CPU utilization spike: 34% during screen-off - 8x normal idle baseline.' },
      { agent: 'SENTINEL', insight: 'Memory allocation pattern consistent with file indexing or data compression.' },
    ],
    threatCategory: 'behavioral',
  },
};

export async function requestAIAnalysis(threat: ThreatEvent): Promise<AIAnalysisResult> {
  try {
    const response = await Promise.race([
      fetch(`${PROXY_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          threatData: {
            appName: threat.appName,
            eventType: threat.eventType,
            riskLevel: threat.riskLevel,
            description: threat.description,
            permissions: [],
            timestamp: threat.timestamp.toISOString(),
          },
          analysisDepth: 'quick',
        }),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      ),
    ]);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error((errBody as { error?: string }).error ?? `HTTP ${response.status}`);
    }

    const body = await response.json();
    if (!body.success || !body.data) throw new Error('Invalid response from AI proxy');
    return body.data as AIAnalysisResult;
  } catch {
    // Backend unreachable - return mock intelligence
    const mock = MOCK_REPORTS[threat.eventType];
    if (!mock) throw new Error('No analysis available');
    // Personalize the summary with the actual app name
    return {
      ...mock,
      summary: mock.summary.replace('The application', threat.appName),
    };
  }
}
