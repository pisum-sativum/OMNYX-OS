export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'safe';
export type PrivacyMode = 'normal' | 'ghost' | 'banking' | 'sleep' | 'travel' | 'focus';
export type AgentStatus = 'active' | 'scanning' | 'idle' | 'alert';
export type TrendDirection = 'improving' | 'declining' | 'stable';

export type ThreatEventType =
  | 'microphone_access'
  | 'camera_access'
  | 'clipboard_read'
  | 'location_access'
  | 'network_request'
  | 'tracker_detected'
  | 'suspicious_permission'
  | 'background_activity';

export interface AppPermission {
  name: string;
  dangerous: boolean;
  category: 'location' | 'microphone' | 'camera' | 'contacts' | 'storage' | 'network' | 'system';
}

export interface ScannedApp {
  id: string;
  appName: string;
  packageName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  permissions: AppPermission[];
  icon?: string;
  lastSeen: Date;
}

export interface ThreatEvent {
  id: string;
  title: string;
  appName: string;
  packageName?: string;
  eventType: ThreatEventType;
  riskLevel: RiskLevel;
  description: string;
  aiExplanation?: string;
  timestamp: Date;
  resolved: boolean;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  confidenceScore: number;
  currentActivity: string;
  lastAction: string;
  iconKey: string;
  color: string;
}

export interface ReplayEvent {
  id: string;
  title: string;
  description: string;
  riskChange: number;
  riskLevel: RiskLevel;
  timestamp: Date;
  appName?: string;
  agentResponse?: string;
}

export interface PrivacyScoreBreakdown {
  permissions: number;
  trackers: number;
  networkActivity: number;
  dataCollection: number;
}

export interface PrivacyScoreData {
  current: number;
  previous: number;
  trend: TrendDirection;
  breakdown: PrivacyScoreBreakdown;
}

export interface PrivacyModeConfig {
  id: PrivacyMode;
  label: string;
  description: string;
  color: string;
}
