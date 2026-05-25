import { buildThreatEvents } from '../privacyIntelligence';
import type {
  AppRiskProfile,
  ScanResult,
  ScannedPermission,
  SuspicionFactor,
} from '@/types/permissions';

// ── Fixture builders ──────────────────────────────────────────────────────────

function makePermission(overrides: Partial<ScannedPermission> = {}): ScannedPermission {
  return {
    androidName: 'android.permission.ACCESS_FINE_LOCATION',
    shortName: 'ACCESS_FINE_LOCATION',
    category: 'location',
    riskWeight: 8,
    isDangerous: true,
    isSpecial: false,
    label: 'Precise location',
    threat: 'Tracks exact physical location',
    isGranted: true,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<AppRiskProfile> = {}): AppRiskProfile {
  return {
    id: 'app_1',
    packageName: 'com.example.app',
    appName: 'Example App',
    installTime: 0,
    lastUpdated: 0,
    versionName: '1.0.0',
    permissions: [],
    riskScore: 0,
    riskTier: 'safe',
    threatPatterns: [],
    suspicionFactors: [],
    confidence: 90,
    isSystemApp: false,
    isSuspicious: false,
    ...overrides,
  };
}

function makeScanResult(profiles: AppRiskProfile[]): ScanResult {
  return {
    id: 'scan_1',
    scannedAt: new Date('2025-01-01T00:00:00Z'),
    appCount: profiles.length,
    criticalCount: profiles.filter(p => p.riskTier === 'critical').length,
    highRiskCount: profiles.filter(p => p.riskTier === 'high').length,
    mediumRiskCount: profiles.filter(p => p.riskTier === 'medium').length,
    safeCount: profiles.filter(p => p.riskTier === 'safe').length,
    profiles,
    overallPrivacyImpact: 0,
    topThreats: [],
    scanDurationMs: 100,
    isNativeScan: true,
  };
}

const dangerousSuspicionFactor: SuspicionFactor = {
  type: 'surveillance_capability',
  severity: 'critical',
  description: 'App can access microphone and location in the background',
  weight: 20,
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('buildThreatEvents', () => {
  it('produces at least one threat event for an app with dangerous permissions granted', () => {
    const riskyApp = makeProfile({
      riskTier: 'critical',
      isSuspicious: true,
      permissions: [
        makePermission({ shortName: 'ACCESS_FINE_LOCATION', isDangerous: true, isGranted: true }),
        makePermission({ shortName: 'RECORD_AUDIO', category: 'microphone', isDangerous: true, isGranted: true }),
      ],
      suspicionFactors: [dangerousSuspicionFactor],
    });

    const events = buildThreatEvents(makeScanResult([riskyApp]));

    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('produces no threat events when no app has dangerous permissions', () => {
    const safeApp = makeProfile({
      packageName: 'com.example.safe',
      appName: 'Safe App',
      riskTier: 'safe',
      permissions: [], // nothing dangerous, nothing to match a tracker profile
      suspicionFactors: [],
      threatPatterns: [],
    });

    const events = buildThreatEvents(makeScanResult([safeApp]));

    expect(events).toHaveLength(0);
  });

  it('emits events with all required fields populated', () => {
    const riskyApp = makeProfile({
      riskTier: 'critical',
      suspicionFactors: [dangerousSuspicionFactor],
      permissions: [makePermission()],
    });

    const events = buildThreatEvents(makeScanResult([riskyApp]));

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(typeof event.id).toBe('string');
      expect(event.id.length).toBeGreaterThan(0);
      expect(typeof event.title).toBe('string');
      expect(event.title.length).toBeGreaterThan(0);
      expect(['critical', 'high', 'medium', 'low', 'safe']).toContain(event.riskLevel);
      expect(typeof event.resolved).toBe('boolean');
    }
  });

  it('marks every newly built threat event as unresolved', () => {
    const riskyApp = makeProfile({
      riskTier: 'high',
      suspicionFactors: [{ ...dangerousSuspicionFactor, severity: 'high' }],
      permissions: [makePermission()],
    });

    const events = buildThreatEvents(makeScanResult([riskyApp]));

    expect(events.length).toBeGreaterThan(0);
    expect(events.every(e => e.resolved === false)).toBe(true);
  });
});
