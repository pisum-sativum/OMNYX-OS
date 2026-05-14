import { PERMISSION_DB } from '@constants/permissionDatabase';
import { classifyThreats } from './threatClassifier';
import type {
  AppRiskProfile,
  ScannedPermission,
  SuspicionFactor,
  RiskTier,
  ThreatPattern,
} from '@/types/permissions';

// App name keywords that indicate a simple utility - used for mismatch detection.
// Security note: we never log these or the app list; analysis is local-only.
const SIMPLE_APP_KEYWORDS = [
  'calculator', 'flashlight', 'torch', 'clock', 'alarm',
  'notepad', 'notes', 'timer', 'counter', 'compass',
  'ruler', 'levels', 'converter', 'battery', 'cleaner',
  'booster', 'scanner', 'qr', 'barcode', 'antivirus',
];

// Permissions that are high-risk regardless of app type
const ALWAYS_HIGH_RISK = new Set([
  'BIND_ACCESSIBILITY_SERVICE',
  'READ_SMS',
  'RECEIVE_SMS',
  'ACCESS_BACKGROUND_LOCATION',
  'REQUEST_INSTALL_PACKAGES',
  'SYSTEM_ALERT_WINDOW',
]);

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function scoreToTier(score: number): RiskTier {
  if (score <= 20) return 'safe';
  if (score <= 42) return 'low';
  if (score <= 64) return 'medium';
  if (score <= 84) return 'high';
  return 'critical';
}

function resolvePermissions(shortNames: string[]): ScannedPermission[] {
  const out: ScannedPermission[] = [];
  for (const name of shortNames) {
    const def = PERMISSION_DB[name];
    if (def) out.push({ ...def, isGranted: true });
  }
  return out;
}

// Returns 0-45 penalty. Only fires when a "simple" app type has high-risk perms.
function mismatchPenalty(appName: string, permissions: ScannedPermission[]): number {
  const lower = appName.toLowerCase();
  const isSimple = SIMPLE_APP_KEYWORDS.some((kw) => lower.includes(kw));
  if (!isSimple) return 0;

  const highRiskCount = permissions.filter(
    (p) => (p.isDangerous || p.isSpecial) && p.riskWeight >= 60
  ).length;

  return clamp(highRiskCount * 15, 0, 45);
}

// Adds a flat bonus when camera + microphone + (location or contacts) are all present.
// This catches apps that have broad surveillance capability without a named pattern.
function generalSurveillanceBonus(shortNames: string[]): number {
  const set = new Set(shortNames);
  const hasCam = set.has('CAMERA');
  const hasMic = set.has('RECORD_AUDIO');
  const hasLocOrContacts =
    set.has('ACCESS_FINE_LOCATION') ||
    set.has('ACCESS_BACKGROUND_LOCATION') ||
    set.has('READ_CONTACTS');

  return hasCam && hasMic && hasLocOrContacts ? 18 : 0;
}

function buildSuspicionFactors(
  appName: string,
  permissions: ScannedPermission[],
  threatPatterns: ThreatPattern[],
): SuspicionFactor[] {
  const factors: SuspicionFactor[] = [];
  const shortNames = permissions.map((p) => p.shortName);
  const set = new Set(shortNames);

  if (threatPatterns.length > 0) {
    const top = threatPatterns[0];
    factors.push({
      type: 'dangerous_combo',
      severity: top.severity >= 88 ? 'critical' : top.severity >= 68 ? 'high' : 'medium',
      description: top.description,
      weight: top.severity,
    });
  }

  const penalty = mismatchPenalty(appName, permissions);
  if (penalty > 0) {
    factors.push({
      type: 'permission_mismatch',
      severity: penalty >= 30 ? 'critical' : 'high',
      description: `"${appName}" has no legitimate need for these sensitive permissions`,
      weight: penalty,
    });
  }

  const highRiskSolo = shortNames.find((p) => ALWAYS_HIGH_RISK.has(p));
  if (highRiskSolo && threatPatterns.length === 0) {
    const def = PERMISSION_DB[highRiskSolo];
    if (def) {
      factors.push({
        type: 'surveillance_capability',
        severity: def.riskWeight >= 85 ? 'critical' : 'high',
        description: def.threat,
        weight: def.riskWeight,
      });
    }
  }

  const hasBgLocation = set.has('ACCESS_BACKGROUND_LOCATION');
  const hasMic = set.has('RECORD_AUDIO');
  if (hasBgLocation && hasMic && threatPatterns.length === 0) {
    factors.push({
      type: 'background_access',
      severity: 'high',
      description: 'Microphone accessible while app runs silently in the background',
      weight: 72,
    });
  }

  const dangerousCount = permissions.filter((p) => p.isDangerous || p.isSpecial).length;
  if (dangerousCount >= 7) {
    factors.push({
      type: 'over_permissioned',
      severity: dangerousCount >= 9 ? 'critical' : 'medium',
      description: `${dangerousCount} sensitive permissions requested - significantly above average`,
      weight: clamp(dangerousCount * 7, 0, 75),
    });
  }

  return factors.sort((a, b) => b.weight - a.weight).slice(0, 3);
}

export function calculateRiskProfile(
  packageName: string,
  appName: string,
  permissionShortNames: string[],
  installTime: number = Date.now(),
  lastUpdated: number = Date.now(),
  isSystemApp: boolean = false,
  versionName: string = '1.0',
): Omit<AppRiskProfile, 'id'> {
  const permissions = resolvePermissions(permissionShortNames);
  const dangerous = permissions.filter((p) => p.isDangerous || p.isSpecial);
  const threatPatterns = classifyThreats(permissionShortNames);
  const suspicionFactors = buildSuspicionFactors(appName, permissions, threatPatterns);

  const highestIndividual =
    dangerous.length > 0 ? Math.max(...dangerous.map((p) => p.riskWeight)) : 0;

  const topComboSeverity =
    threatPatterns.length > 0 ? threatPatterns[0].severity : 0;

  const permDensityScore = clamp((dangerous.length / 6) * 100, 0, 100);

  const rawScore =
    highestIndividual * 0.30 +
    topComboSeverity * 0.35 +
    permDensityScore * 0.12 +
    generalSurveillanceBonus(permissionShortNames) +
    mismatchPenalty(appName, permissions);

  const finalScore = clamp(
    Math.round(isSystemApp ? rawScore * 0.6 : rawScore),
    0,
    100
  );

  const confidence = clamp(
    50 + permissions.length * 4 + (threatPatterns.length > 0 ? 20 : 0),
    50,
    98
  );

  return {
    packageName,
    appName,
    installTime,
    lastUpdated,
    versionName,
    permissions,
    riskScore: finalScore,
    riskTier: scoreToTier(finalScore),
    threatPatterns,
    suspicionFactors,
    confidence,
    isSystemApp,
    isSuspicious: finalScore >= 63 || threatPatterns.some((p) => p.severity >= 75),
  };
}

export function calculatePrivacyImpact(profiles: AppRiskProfile[]): number {
  if (profiles.length === 0) return 100;

  const criticalCount = profiles.filter((p) => p.riskTier === 'critical').length;
  const highCount = profiles.filter((p) => p.riskTier === 'high').length;
  const mediumCount = profiles.filter((p) => p.riskTier === 'medium').length;

  const impact = criticalCount * 22 + highCount * 10 + mediumCount * 3;
  return clamp(100 - impact, 0, 100);
}
