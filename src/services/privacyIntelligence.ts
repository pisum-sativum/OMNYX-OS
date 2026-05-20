/**
 * Privacy Intelligence Service
 *
 * Converts real scan results into structured privacy intelligence:
 * - ThreatEvent[] for the threat feed (only what we can actually detect)
 * - PrivacyScoreData derived from real device analysis
 * - OmnyxEvent[] for the event bus
 *
 * TRUST CONTRACT:
 * This module ONLY generates events for things we can verify from
 * PackageManager data. It never claims runtime detections (mic access,
 * clipboard reads, etc.) from static permission analysis.
 *
 * Detectable from PackageManager:
 *   - Suspicious permission combinations (suspicious_permission)
 *   - Tracker permission profile matches (tracker_detected)
 *
 * NOT detectable without runtime signals (not generated here):
 *   - microphone_access, camera_access, clipboard_read,
 *     network_request, background_activity
 */

import type { ThreatEvent, PrivacyScoreData, TrendDirection, ReplayEvent } from '@/types';
import type { ScanResult, AppRiskProfile } from '@/types/permissions';
import type { OmnyxEvent } from '@/events/types';
import { detectTrackers } from './trackerDetector';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Privacy score computation from real data ───────────────────────────────────

export function computePrivacyScore(
  scanResult: ScanResult,
  previousScore: number,
): PrivacyScoreData {
  const { profiles } = scanResult;
  const nonSystem = profiles.filter(p => !p.isSystemApp);

  const criticalApps = nonSystem.filter(p => p.riskTier === 'critical');
  const highApps = nonSystem.filter(p => p.riskTier === 'high');
  const mediumApps = nonSystem.filter(p => p.riskTier === 'medium');
  const trackerResults = detectTrackers(nonSystem);

  // Penalty model: each category has a cap to prevent single-app domination
  const permissionPenalty = clamp(
    criticalApps.length * 18 + highApps.length * 8 + mediumApps.length * 2,
    0, 60
  );
  const trackerPenalty = clamp(
    trackerResults.filter(t => t.overallRisk === 'critical').length * 12 +
    trackerResults.filter(t => t.overallRisk === 'high').length * 6,
    0, 30
  );

  const permissionsScore = clamp(100 - permissionPenalty, 20, 100);
  const trackersScore = clamp(100 - trackerPenalty, 20, 100);

  // Network activity and data collection are estimated from permission analysis
  const hasNetworkTrackers = trackerResults.filter((t) =>
    t.matchedPatterns.some((m) => m.pattern.category === 'advertising' || m.pattern.category === 'analytics')
  ).length;
  const networkScore = clamp(100 - hasNetworkTrackers * 10, 20, 100);
  const dataCollectionScore = clamp(100 - trackerPenalty - (criticalApps.length * 5), 20, 100);

  const current = Math.round(
    permissionsScore * 0.40 +
    trackersScore * 0.30 +
    networkScore * 0.15 +
    dataCollectionScore * 0.15
  );

  const trend: TrendDirection =
    current > previousScore + 2 ? 'improving' :
    current < previousScore - 2 ? 'declining' : 'stable';

  return {
    current,
    previous: previousScore,
    trend,
    breakdown: {
      permissions: permissionsScore,
      trackers: trackersScore,
      networkActivity: networkScore,
      dataCollection: dataCollectionScore,
    },
  };
}

// ── Real ThreatEvent generation ───────────────────────────────────────────────

export function buildThreatEvents(scanResult: ScanResult): ThreatEvent[] {
  const { profiles } = scanResult;
  const nonSystem = profiles.filter(p => !p.isSystemApp);
  const trackerResults = detectTrackers(nonSystem);
  const events: ThreatEvent[] = [];
  const now = new Date();

  // Generate suspicious_permission events for high/critical apps
  const riskyApps = nonSystem.filter(p =>
    (p.riskTier === 'critical' || p.riskTier === 'high') && p.suspicionFactors.length > 0
  );

  for (const app of riskyApps) {
    const topFactor = app.suspicionFactors[0];
    const topPattern = app.threatPatterns[0];

    // Skip if this app will also appear as a tracker detection (avoid duplication)
    const hasTrackerEvent = trackerResults.some(t => t.packageName === app.packageName);
    if (hasTrackerEvent && app.riskTier !== 'critical') continue;

    const description = topPattern
      ? topPattern.description
      : topFactor?.description ?? `${app.permissions.filter(p => p.isDangerous).length} sensitive permissions detected`;

    events.push({
      id: genId('perm'),
      title: topPattern?.label ?? `${app.appName} — Suspicious Permission Profile`,
      appName: app.appName,
      packageName: app.packageName,
      eventType: 'suspicious_permission',
      riskLevel: app.riskTier === 'critical' ? 'critical' : 'high',
      description,
      timestamp: new Date(now.getTime() - Math.random() * 300000),
      resolved: false,
    });
  }

  // Generate tracker_detected events
  for (const result of trackerResults) {
    const topMatch = result.matchedPatterns[0];
    const knownRisk = result.knownPackageRisk;

    let description: string;
    if (knownRisk) {
      description = knownRisk.reason.slice(0, 200);
    } else if (topMatch) {
      const permList = topMatch.matchedPermissions.slice(0, 3).join(', ');
      description = `Permission profile consistent with ${topMatch.pattern.name}. Matched: ${permList}`;
    } else {
      continue;
    }

    events.push({
      id: genId('track'),
      title: knownRisk?.label ?? topMatch?.pattern.name ?? `${result.appName} — Tracker Signature`,
      appName: result.appName,
      packageName: result.packageName,
      eventType: 'tracker_detected',
      riskLevel: result.overallRisk === 'critical' ? 'critical' :
                 result.overallRisk === 'high' ? 'high' : 'medium',
      description,
      timestamp: new Date(now.getTime() - Math.random() * 300000),
      resolved: false,
    });
  }

  // Sort: critical first, then by timestamp desc
  return events.sort((a, b) => {
    const riskOrder = { critical: 4, high: 3, medium: 2, low: 1, safe: 0 };
    const riskDiff = (riskOrder[b.riskLevel] ?? 0) - (riskOrder[a.riskLevel] ?? 0);
    if (riskDiff !== 0) return riskDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}

// ── OmnyxEvent generation for event bus ───────────────────────────────────────

export function buildScanOmnyxEvents(
  scanResult: ScanResult,
  threatEvents: ThreatEvent[],
): OmnyxEvent[] {
  const events: OmnyxEvent[] = [];
  const now = Date.now();

  const criticalCount = threatEvents.filter(e => e.riskLevel === 'critical').length;
  const highCount = threatEvents.filter(e => e.riskLevel === 'high').length;

  // Scan complete event - always emitted after a real scan
  events.push({
    id: `scan_${now}`,
    type: 'SCAN_COMPLETE',
    timestamp: now,
    severity: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'info',
    confidence: 95,
    source: 'permission_scan',
    title: 'Device scan complete',
    description: `${scanResult.appCount} apps analyzed. ${criticalCount + highCount} risks identified.`,
    agentTargets: ['threat-agent'],
    uiReaction: {
      atmosphereShift: criticalCount > 0 ? 'escalate' : highCount > 2 ? 'escalate' : 'none',
      pulseIntensity: Math.min(criticalCount * 30 + highCount * 15, 100),
      radarBurst: criticalCount > 0,
      swarmAlert: criticalCount > 0 || highCount > 2,
    },
    payload: {
      appCount: scanResult.appCount,
      criticalCount,
      highCount,
      isNativeScan: scanResult.isNativeScan,
    },
  });

  // Emit THREAT_DETECTED for the most severe finding
  const topThreat = threatEvents[0];
  if (topThreat && (topThreat.riskLevel === 'critical' || topThreat.riskLevel === 'high')) {
    events.push({
      id: `threat_${now}`,
      type: 'THREAT_DETECTED',
      timestamp: now + 1,
      severity: topThreat.riskLevel as OmnyxEvent['severity'],
      confidence: 85,
      source: 'permission_scan',
      title: `${topThreat.appName}: ${topThreat.riskLevel} risk`,
      description: topThreat.description.slice(0, 128),
      agentTargets: ['threat-agent', 'network-agent'],
      uiReaction: {
        atmosphereShift: topThreat.riskLevel === 'critical' ? 'escalate' : 'none',
        pulseIntensity: topThreat.riskLevel === 'critical' ? 85 : 55,
        radarBurst: topThreat.riskLevel === 'critical',
        swarmAlert: true,
      },
      payload: {
        appName: topThreat.appName,
        riskLevel: topThreat.riskLevel,
        eventType: topThreat.eventType,
      },
    });
  }

  return events;
}

// ── ReplayEvent generation from scan data ────────────────────────────────────

export function buildReplayEvents(
  scanResult: ScanResult,
  threatEvents: ThreatEvent[],
  privacyScore: PrivacyScoreData,
): ReplayEvent[] {
  const events: ReplayEvent[] = [];
  const riskChangeMap: Record<string, number> = {
    critical: 15, high: 8, medium: 4, low: 1, safe: 0,
  };

  const delta = privacyScore.current - privacyScore.previous;
  events.push({
    id: `replay_scan_${scanResult.scannedAt.getTime()}`,
    title: 'Device Scan Complete',
    description: `${scanResult.appCount} apps analyzed. Privacy score: ${privacyScore.current}/100.${!scanResult.isNativeScan ? ' Simulation mode.' : ''}`,
    riskChange: delta,
    riskLevel: privacyScore.current >= 70 ? 'safe' : privacyScore.current >= 50 ? 'medium' : 'high',
    timestamp: scanResult.scannedAt,
    agentResponse: `Permission analysis engine processed ${scanResult.appCount} application profiles.`,
  });

  for (const threat of threatEvents.slice(0, 5)) {
    events.push({
      id: `replay_threat_${threat.id}`,
      title: threat.eventType === 'tracker_detected'
        ? 'Tracker Signature Identified'
        : 'Suspicious Permission Profile',
      description: threat.description.slice(0, 140),
      riskChange: riskChangeMap[threat.riskLevel] ?? 5,
      riskLevel: threat.riskLevel,
      timestamp: threat.timestamp,
      appName: threat.appName,
      agentResponse: threat.eventType === 'tracker_detected'
        ? 'Threat Agent flagged tracker SDK signature from permission profile analysis.'
        : 'Threat Agent identified anomalous permission cluster.',
    });
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ── Install event → single ThreatEvent ────────────────────────────────────────

export function buildInstallThreatEvent(profile: Omit<AppRiskProfile, 'id'> & { id?: string }): ThreatEvent | null {
  if (profile.riskTier === 'safe' || profile.riskTier === 'low') return null;

  const topPattern = profile.threatPatterns[0];
  const topFactor = profile.suspicionFactors[0];

  const description = topPattern?.description ??
    topFactor?.description ??
    `${profile.permissions.filter((p) => p.isDangerous).length} sensitive permissions declared`;

  return {
    id: genId('install'),
    title: topPattern?.label ?? `${profile.appName} — New Install Risk`,
    appName: profile.appName,
    packageName: profile.packageName,
    eventType: profile.threatPatterns.length > 0 ? 'suspicious_permission' : 'tracker_detected',
    riskLevel: profile.riskTier === 'critical' ? 'critical' :
               profile.riskTier === 'high' ? 'high' : 'medium',
    description,
    timestamp: new Date(),
    resolved: false,
  };
}
