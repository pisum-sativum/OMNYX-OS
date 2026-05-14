export type PermissionCategory =
  | 'location'
  | 'microphone'
  | 'camera'
  | 'contacts'
  | 'storage'
  | 'phone'
  | 'sms'
  | 'calendar'
  | 'sensors'
  | 'network'
  | 'background'
  | 'accessibility'
  | 'notification'
  | 'device_id'
  | 'overlay'
  | 'package_management';

export type RiskTier = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export type ThreatPatternId =
  | 'stalkerware'
  | 'financial_fraud'
  | 'data_harvesting'
  | 'spyware'
  | 'adware_aggressive'
  | 'surveillance'
  | 'identity_theft'
  | 'device_hijack';

export interface PermissionDefinition {
  androidName: string;
  shortName: string;
  category: PermissionCategory;
  riskWeight: number;
  isDangerous: boolean;
  isSpecial: boolean;
  label: string;
  threat: string;
}

export interface ScannedPermission {
  androidName: string;
  shortName: string;
  category: PermissionCategory;
  riskWeight: number;
  isDangerous: boolean;
  isSpecial: boolean;
  label: string;
  threat: string;
  isGranted: boolean;
}

export interface ThreatPattern {
  id: ThreatPatternId;
  label: string;
  severity: number;
  description: string;
  matchedPermissions: string[];
}

export interface SuspicionFactor {
  type:
    | 'permission_mismatch'
    | 'dangerous_combo'
    | 'background_access'
    | 'over_permissioned'
    | 'surveillance_capability';
  severity: RiskTier;
  description: string;
  weight: number;
}

export interface AppRiskProfile {
  id: string;
  packageName: string;
  appName: string;
  installTime: number;
  lastUpdated: number;
  versionName: string;
  permissions: ScannedPermission[];
  riskScore: number;
  riskTier: RiskTier;
  threatPatterns: ThreatPattern[];
  suspicionFactors: SuspicionFactor[];
  confidence: number;
  isSystemApp: boolean;
  isSuspicious: boolean;
}

export interface ScanProgress {
  phase: 'enumerating' | 'analyzing' | 'scoring' | 'complete';
  current: number;
  total: number;
  currentApp?: string;
}

export interface ScanResult {
  id: string;
  scannedAt: Date;
  appCount: number;
  criticalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  safeCount: number;
  profiles: AppRiskProfile[];
  overallPrivacyImpact: number;
  topThreats: string[];
  scanDurationMs: number;
  isNativeScan: boolean;
}

export interface ScanState {
  status: 'idle' | 'scanning' | 'complete' | 'error';
  progress: ScanProgress | null;
  result: ScanResult | null;
  error: string | null;
  isNativeAvailable: boolean;
}
