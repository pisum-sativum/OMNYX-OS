/**
 * Tracker detection service.
 *
 * Analyzes app permission sets against known tracker patterns.
 * All detection is local, probabilistic, and permission-based.
 * No bytecode analysis, no network calls, no PII leaves device.
 *
 * Detection confidence levels:
 * - "probable": 3+ core permissions match a known pattern
 * - "likely": 2 core permissions + adjacent signals
 * - "possible": pattern partially matches, below threshold
 *
 * LIMITATION: This is NOT definitive SDK detection. We cannot confirm
 * a specific SDK without APK bytecode analysis (as Exodus Privacy does).
 * All results should be communicated as "permission profile consistent with."
 */

import {
  TRACKER_PATTERNS,
  KNOWN_HIGH_RISK_PACKAGES,
  type TrackerDetectionResult,
  type TrackerRisk,
} from '@data/trackerDatabase';
import type { AppRiskProfile } from '@/types/permissions';

function riskPriority(r: TrackerRisk): number {
  const map: Record<TrackerRisk, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return map[r];
}

function highestRisk(risks: TrackerRisk[]): TrackerRisk {
  if (risks.length === 0) return 'low';
  return risks.reduce((best, r) => riskPriority(r) > riskPriority(best) ? r : best, 'low' as TrackerRisk);
}

function detectPatternsForApp(
  packageName: string,
  permissions: string[],
): TrackerDetectionResult['matchedPatterns'] {
  const permSet = new Set(permissions);
  const matched: TrackerDetectionResult['matchedPatterns'] = [];

  for (const pattern of TRACKER_PATTERNS) {
    for (const group of pattern.permissionGroups) {
      const matchedPerms = group.filter((p) => permSet.has(p));
      const minMatch = pattern.minMatchCount ?? group.length;

      if (matchedPerms.length < minMatch) continue;

      const ratio = matchedPerms.length / group.length;
      let confidence: 'probable' | 'likely' | 'possible';
      if (ratio >= 1.0) confidence = 'probable';
      else if (ratio >= 0.75) confidence = 'likely';
      else confidence = 'possible';

      matched.push({ pattern, matchedPermissions: matchedPerms, confidence });
      break; // one match per pattern is enough
    }
  }

  return matched;
}

export function detectTrackers(profiles: AppRiskProfile[]): TrackerDetectionResult[] {
  const results: TrackerDetectionResult[] = [];

  for (const profile of profiles) {
    if (profile.isSystemApp) continue;

    const permissions = profile.permissions.map((p) => p.shortName);
    const matchedPatterns = detectPatternsForApp(profile.packageName, permissions);
    const knownPackageRisk = KNOWN_HIGH_RISK_PACKAGES[profile.packageName];

    // Only surface if there is something real to report
    if (matchedPatterns.length === 0 && !knownPackageRisk) continue;

    const patternRisks = matchedPatterns.map(m => m.pattern.riskLevel);
    const knownRisk = knownPackageRisk?.riskLevel;
    const allRisks: TrackerRisk[] = [...patternRisks, ...(knownRisk ? [knownRisk] : [])];

    results.push({
      appName: profile.appName,
      packageName: profile.packageName,
      matchedPatterns,
      knownPackageRisk,
      overallRisk: highestRisk(allRisks),
    });
  }

  // Sort by risk: critical first
  return results.sort((a, b) => riskPriority(b.overallRisk) - riskPriority(a.overallRisk));
}

export function summarizeTrackerDetections(results: TrackerDetectionResult[]): {
  totalAppsWithTrackers: number;
  criticalCount: number;
  highCount: number;
  topFindings: string[];
} {
  const critical = results.filter(r => r.overallRisk === 'critical');
  const high = results.filter(r => r.overallRisk === 'high');

  const topFindings: string[] = [];

  for (const r of results.slice(0, 4)) {
    const topPattern = r.matchedPatterns[0];
    if (r.knownPackageRisk) {
      topFindings.push(`${r.appName}: ${r.knownPackageRisk.label} - ${r.knownPackageRisk.reason.slice(0, 80)}`);
    } else if (topPattern) {
      topFindings.push(`${r.appName}: permission profile consistent with ${topPattern.pattern.name}`);
    }
  }

  return {
    totalAppsWithTrackers: results.length,
    criticalCount: critical.length,
    highCount: high.length,
    topFindings,
  };
}
