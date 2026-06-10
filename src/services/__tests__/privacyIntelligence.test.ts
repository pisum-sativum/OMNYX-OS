import { buildThreatEvents, computePrivacyScore } from '../privacyIntelligence';
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

// ── computePrivacyScore ───────────────────────────────────────────────────────

describe('computePrivacyScore', () => {
  it('returns a score close to 100 for a clean device with no dangerous permissions', () => {
    const cleanDevice = makeScanResult([
      makeProfile({ packageName: 'com.example.a', riskTier: 'safe', permissions: [] }),
      makeProfile({ packageName: 'com.example.b', riskTier: 'safe', permissions: [] }),
    ]);

    const result = computePrivacyScore(cleanDevice, 100);

    expect(result.current).toBeGreaterThanOrEqual(95);
    expect(result.breakdown.permissions).toBe(100);
    expect(result.breakdown.trackers).toBe(100);
  });

  it('returns a lower score for a device with many high-risk apps than for a clean device', () => {
    const cleanScore = computePrivacyScore(
      makeScanResult([makeProfile({ riskTier: 'safe', permissions: [] })]),
      50,
    ).current;

    const riskyDevice = makeScanResult([
      makeProfile({ packageName: 'com.risk.1', riskTier: 'critical', permissions: [] }),
      makeProfile({ packageName: 'com.risk.2', riskTier: 'critical', permissions: [] }),
      makeProfile({ packageName: 'com.risk.3', riskTier: 'critical', permissions: [] }),
      makeProfile({ packageName: 'com.risk.4', riskTier: 'high', permissions: [] }),
      makeProfile({ packageName: 'com.risk.5', riskTier: 'high', permissions: [] }),
    ]);
    const riskyScore = computePrivacyScore(riskyDevice, 50).current;

    expect(riskyScore).toBeLessThan(cleanScore);
  });

  it('keeps the score within 0-100 for clean, extreme, and empty inputs', () => {
    const inputs: ScanResult[] = [
      makeScanResult([]), // no apps at all
      makeScanResult([makeProfile({ riskTier: 'safe', permissions: [] })]),
      makeScanResult(
        // 50 critical apps — push penalties to their caps
        Array.from({ length: 50 }, (_, i) =>
          makeProfile({ packageName: `com.flood.${i}`, riskTier: 'critical', permissions: [] }),
        ),
      ),
    ];

    for (const scan of inputs) {
      for (const previous of [0, 50, 100, -999, 9999]) {
        const { current } = computePrivacyScore(scan, previous);
        expect(current).toBeGreaterThanOrEqual(0);
        expect(current).toBeLessThanOrEqual(100);
      }
    }
  });

  it("reports 'improving' when the current score rises above the previous one", () => {
    // A clean device scores ~100; against a lower previous score the trend improves.
    const cleanDevice = makeScanResult([makeProfile({ riskTier: 'safe', permissions: [] })]);

    const result = computePrivacyScore(cleanDevice, 40);

    expect(result.current).toBeGreaterThan(result.previous + 2);
    expect(result.trend).toBe('improving');
  });

  it("reports 'declining' when the current score falls below the previous one", () => {
    // A heavily compromised device scores low; against a high previous score it declines.
    const riskyDevice = makeScanResult(
      Array.from({ length: 5 }, (_, i) =>
        makeProfile({ packageName: `com.risk.${i}`, riskTier: 'critical', permissions: [] }),
      ),
    );

    const result = computePrivacyScore(riskyDevice, 100);

    expect(result.current).toBeLessThan(result.previous - 2);
    expect(result.trend).toBe('declining');
  });
});
