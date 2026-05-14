import type { ThreatPattern, ThreatPatternId } from '@/types/permissions';

interface PatternDefinition {
  id: ThreatPatternId;
  label: string;
  severity: number;
  description: string;
  required: string[];
  bonus: string[];
  bonusThreshold: number;
}

// Each pattern requires ALL items in `required` plus at least `bonusThreshold` from `bonus`.
// Severity is used directly in the risk formula - keep it calibrated.
const PATTERNS: PatternDefinition[] = [
  {
    id: 'device_hijack',
    label: 'Device Control Risk',
    severity: 95,
    description: 'Accessibility service grants near-total device control: reads screen, intercepts input, performs automated actions',
    required: ['BIND_ACCESSIBILITY_SERVICE'],
    bonus: ['SYSTEM_ALERT_WINDOW', 'READ_SMS', 'WRITE_SETTINGS'],
    bonusThreshold: 0,
  },
  {
    id: 'stalkerware',
    label: 'Covert Surveillance',
    severity: 92,
    description: 'Combination enables silent location tracking, audio recording, and contact monitoring - stalkerware capability',
    required: ['ACCESS_BACKGROUND_LOCATION', 'RECORD_AUDIO', 'READ_CONTACTS'],
    bonus: ['CAMERA', 'READ_SMS'],
    bonusThreshold: 1,
  },
  {
    id: 'financial_fraud',
    label: 'Financial Exposure',
    severity: 90,
    description: 'SMS read access with overlay or accessibility permissions can intercept 2FA codes and hijack banking sessions',
    required: ['READ_SMS'],
    bonus: ['BIND_ACCESSIBILITY_SERVICE', 'SYSTEM_ALERT_WINDOW', 'RECEIVE_SMS'],
    bonusThreshold: 1,
  },
  {
    id: 'data_harvesting',
    label: 'Mass Data Collection',
    severity: 82,
    description: 'Bulk access to personal communications: contact list, call history, and messages enable large-scale profiling',
    required: ['READ_CONTACTS', 'READ_CALL_LOG'],
    bonus: ['READ_SMS', 'READ_CALENDAR', 'ACCESS_FINE_LOCATION'],
    bonusThreshold: 1,
  },
  {
    id: 'surveillance',
    label: 'Audio-Visual Surveillance',
    severity: 80,
    description: 'Camera and microphone with location access enable comprehensive physical-world monitoring',
    required: ['RECORD_AUDIO', 'CAMERA'],
    bonus: ['ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION'],
    bonusThreshold: 2,
  },
  {
    id: 'spyware',
    label: 'Persistent Background Tracking',
    severity: 74,
    description: 'Auto-starts and accesses background location - capable of building a continuous movement history',
    required: ['ACCESS_BACKGROUND_LOCATION', 'RECEIVE_BOOT_COMPLETED'],
    bonus: ['RECORD_AUDIO', 'READ_CONTACTS', 'READ_SMS', 'WRITE_SETTINGS'],
    bonusThreshold: 1,
  },
  {
    id: 'identity_theft',
    label: 'Identity Data Exposure',
    severity: 55,
    description: 'Device identifier combined with contacts and location creates a complete personal profile for identity linking',
    required: ['READ_PHONE_STATE', 'READ_CONTACTS'],
    bonus: ['ACCESS_FINE_LOCATION', 'READ_CALENDAR', 'READ_CALL_LOG'],
    bonusThreshold: 1,
  },
  {
    id: 'adware_aggressive',
    label: 'Overlay Manipulation',
    severity: 65,
    description: 'Screen overlay permission with persistent access allows UI spoofing and credential phishing overlays',
    required: ['SYSTEM_ALERT_WINDOW'],
    bonus: ['READ_PHONE_STATE', 'ACCESS_WIFI_STATE', 'RECEIVE_BOOT_COMPLETED'],
    bonusThreshold: 2,
  },
];

export function classifyThreats(permissionShortNames: string[]): ThreatPattern[] {
  const permSet = new Set(permissionShortNames);
  const matched: ThreatPattern[] = [];

  for (const pattern of PATTERNS) {
    const allRequired = pattern.required.every((p) => permSet.has(p));
    if (!allRequired) continue;

    const bonusMatches = pattern.bonus.filter((p) => permSet.has(p));
    if (bonusMatches.length < pattern.bonusThreshold) continue;

    matched.push({
      id: pattern.id,
      label: pattern.label,
      severity: pattern.severity,
      description: pattern.description,
      matchedPermissions: [...pattern.required, ...bonusMatches],
    });
  }

  return matched.sort((a, b) => b.severity - a.severity);
}
