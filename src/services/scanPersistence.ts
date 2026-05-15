/**
 * Scan result persistence layer.
 *
 * Uses AsyncStorage for scan result caching. All data is local-only.
 * No PII transmitted. The stored data (app names, permissions, risk scores)
 * is the same data visible to any Android app using PackageManager.
 *
 * Future: migrate to SQLCipher-backed encrypted SQLite for richer
 * historical queries and delta analysis. AsyncStorage is the interim path.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanResult } from '@/types/permissions';
import type { ThreatEvent } from '@/types';

const KEYS = {
  lastScanResult: 'omnyx_last_scan_result',
  lastScanTimestamp: 'omnyx_last_scan_ts',
  previousScore: 'omnyx_previous_score',
  threatEvents: 'omnyx_threat_events',
} as const;

export interface PersistedScanState {
  scanResult: ScanResult | null;
  lastScanTimestamp: number | null;
  previousScore: number;
  threatEvents: ThreatEvent[];
}

// ScanResult contains Date objects which need serialization
function serializeScanResult(result: ScanResult): string {
  return JSON.stringify(result, (_, v) =>
    v instanceof Date ? { __date: v.toISOString() } : v
  );
}

function deserializeScanResult(json: string): ScanResult {
  return JSON.parse(json, (_, v) => {
    if (v && typeof v === 'object' && '__date' in v) return new Date(v.__date);
    return v;
  });
}

function serializeThreatEvents(events: ThreatEvent[]): string {
  return JSON.stringify(events, (_, v) =>
    v instanceof Date ? { __date: v.toISOString() } : v
  );
}

function deserializeThreatEvents(json: string): ThreatEvent[] {
  return JSON.parse(json, (_, v) => {
    if (v && typeof v === 'object' && '__date' in v) return new Date(v.__date);
    return v;
  });
}

export async function saveScanState(
  scanResult: ScanResult,
  threatEvents: ThreatEvent[],
  currentScore: number,
): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [KEYS.lastScanResult, serializeScanResult(scanResult)],
      [KEYS.lastScanTimestamp, String(Date.now())],
      [KEYS.previousScore, String(currentScore)],
      [KEYS.threatEvents, serializeThreatEvents(threatEvents)],
    ]);
  } catch {
    // Persistence failure is non-fatal - app continues with in-memory state
  }
}

export async function loadScanState(): Promise<PersistedScanState> {
  try {
    const pairs = await AsyncStorage.multiGet([
      KEYS.lastScanResult,
      KEYS.lastScanTimestamp,
      KEYS.previousScore,
      KEYS.threatEvents,
    ]);

    const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

    const scanResult = map[KEYS.lastScanResult]
      ? deserializeScanResult(map[KEYS.lastScanResult]!)
      : null;

    const lastScanTimestamp = map[KEYS.lastScanTimestamp]
      ? Number(map[KEYS.lastScanTimestamp])
      : null;

    const previousScore = map[KEYS.previousScore]
      ? Number(map[KEYS.previousScore])
      : 100;

    const threatEvents = map[KEYS.threatEvents]
      ? deserializeThreatEvents(map[KEYS.threatEvents]!)
      : [];

    return { scanResult, lastScanTimestamp, previousScore, threatEvents };
  } catch {
    return { scanResult: null, lastScanTimestamp: null, previousScore: 100, threatEvents: [] };
  }
}

export async function clearScanState(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {
    // non-fatal
  }
}

/** Returns the previous privacy score for delta computation. Defaults to 100 (best case). */
export async function getPreviousScore(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(KEYS.previousScore);
    return val ? Number(val) : 100;
  } catch {
    return 100;
  }
}
