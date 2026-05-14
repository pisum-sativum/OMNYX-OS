/**
 * Permission Scanner Service
 *
 * Security architecture:
 * - All analysis runs locally on-device. No data is transmitted.
 * - App metadata (names, permissions) is held only in memory (Zustand).
 * - Sensitive data is never written to console in production paths.
 * - App names are sanitized (trimmed, max-length) before entering the risk engine.
 * - Native module is accessed only when QUERY_ALL_PACKAGES is granted.
 * - On permission denial or native unavailability, falls back to demo data.
 */

import { NativeModules, Platform } from 'react-native';
import { calculateRiskProfile, calculatePrivacyImpact } from './riskEngine';
import type { AppRiskProfile, ScanProgress, ScanResult } from '@/types/permissions';

// Native bridge - provided by modules/permission-scanner after `npx expo prebuild`.
// Gracefully absent when running in Expo Go or before first native build.
const NativeScanner: {
  scanInstalledApps: () => Promise<NativeAppData[]>;
  hasPermission: () => Promise<boolean>;
} | null = Platform.OS === 'android'
  ? (NativeModules.OmnyxPermissionScanner ?? null)
  : null;

interface NativeAppData {
  packageName: string;
  appName: string;
  permissions: string[];
  installTime: number;
  lastUpdated: number;
  versionName: string;
  isSystemApp: boolean;
}

// Sanitize app name before it enters the risk engine or UI.
function sanitizeAppName(raw: string): string {
  return raw.trim().slice(0, 64);
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ── Mock data ──────────────────────────────────────────────────────────────────
// These represent realistic real-world apps spanning all risk tiers.
// Processed through the real risk engine - not hardcoded risk scores.
const MOCK_APP_SEEDS: NativeAppData[] = [
  {
    packageName: 'com.alarm.clock.simple',
    appName: 'Alarm Clock',
    permissions: ['VIBRATE', 'POST_NOTIFICATIONS', 'WAKE_LOCK'],
    installTime: Date.now() - 86_400_000 * 400,
    lastUpdated: Date.now() - 86_400_000 * 20,
    versionName: '2.1.4',
    isSystemApp: false,
  },
  {
    packageName: 'com.notes.simple',
    appName: 'Simple Notes',
    permissions: ['INTERNET', 'POST_NOTIFICATIONS'],
    installTime: Date.now() - 86_400_000 * 180,
    lastUpdated: Date.now() - 86_400_000 * 10,
    versionName: '1.8.0',
    isSystemApp: false,
  },
  {
    packageName: 'com.bank.retail.app',
    appName: 'My Bank',
    permissions: ['CAMERA', 'USE_BIOMETRIC', 'INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE', 'POST_NOTIFICATIONS'],
    installTime: Date.now() - 86_400_000 * 100,
    lastUpdated: Date.now() - 86_400_000 * 14,
    versionName: '5.2.1',
    isSystemApp: false,
  },
  {
    packageName: 'com.spotify.music',
    appName: 'Spotify',
    permissions: ['RECORD_AUDIO', 'BLUETOOTH', 'INTERNET', 'ACCESS_NETWORK_STATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS'],
    installTime: Date.now() - 86_400_000 * 200,
    lastUpdated: Date.now() - 86_400_000 * 5,
    versionName: '8.8.42',
    isSystemApp: false,
  },
  {
    packageName: 'com.android.chrome',
    appName: 'Google Chrome',
    permissions: ['CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'READ_EXTERNAL_STORAGE', 'VIBRATE', 'INTERNET', 'ACCESS_NETWORK_STATE'],
    installTime: Date.now() - 86_400_000 * 400,
    lastUpdated: Date.now() - 86_400_000 * 3,
    versionName: '120.0.6099',
    isSystemApp: false,
  },
  {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp',
    permissions: ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'READ_EXTERNAL_STORAGE', 'ACCESS_FINE_LOCATION', 'READ_PHONE_STATE', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
    installTime: Date.now() - 86_400_000 * 365,
    lastUpdated: Date.now() - 86_400_000 * 2,
    versionName: '2.24.4.76',
    isSystemApp: false,
  },
  {
    packageName: 'com.instagram.android',
    appName: 'Instagram',
    permissions: ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION', 'READ_EXTERNAL_STORAGE', 'INTERNET', 'RECEIVE_BOOT_COMPLETED', 'ACCESS_WIFI_STATE'],
    installTime: Date.now() - 86_400_000 * 300,
    lastUpdated: Date.now() - 86_400_000 * 1,
    versionName: '314.0.0.46',
    isSystemApp: false,
  },
  {
    packageName: 'com.google.android.maps',
    appName: 'Google Maps',
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'CAMERA', 'RECORD_AUDIO', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
    installTime: Date.now() - 86_400_000 * 400,
    lastUpdated: Date.now() - 86_400_000 * 6,
    versionName: '11.109.0101',
    isSystemApp: false,
  },
  {
    packageName: 'com.zhiliaoapp.musically',
    appName: 'TikTok',
    permissions: ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION', 'READ_PHONE_STATE', 'READ_EXTERNAL_STORAGE', 'INTERNET', 'RECEIVE_BOOT_COMPLETED', 'ACCESS_WIFI_STATE', 'BLUETOOTH_SCAN'],
    installTime: Date.now() - 86_400_000 * 90,
    lastUpdated: Date.now() - 86_400_000 * 1,
    versionName: '34.1.3',
    isSystemApp: false,
  },
  {
    packageName: 'com.contacts.backup.pro',
    appName: 'Contacts+ Backup',
    permissions: ['READ_CONTACTS', 'WRITE_CONTACTS', 'READ_CALL_LOG', 'READ_SMS', 'READ_PHONE_STATE', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
    installTime: Date.now() - 86_400_000 * 12,
    lastUpdated: Date.now() - 86_400_000 * 12,
    versionName: '1.0.2',
    isSystemApp: false,
  },
  {
    packageName: 'com.facebook.katana',
    appName: 'Facebook',
    permissions: ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'READ_CALL_LOG', 'READ_PHONE_STATE', 'SYSTEM_ALERT_WINDOW', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
    installTime: Date.now() - 86_400_000 * 500,
    lastUpdated: Date.now() - 86_400_000 * 1,
    versionName: '449.0.0.47',
    isSystemApp: false,
  },
  {
    packageName: 'com.freevpn.proxy.master',
    appName: 'Free VPN Pro',
    permissions: ['READ_PHONE_STATE', 'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'RECEIVE_BOOT_COMPLETED', 'INTERNET', 'WRITE_SETTINGS'],
    installTime: Date.now() - 86_400_000 * 5,
    lastUpdated: Date.now() - 86_400_000 * 5,
    versionName: '3.0.1',
    isSystemApp: false,
  },
  {
    packageName: 'com.torch.pro.free',
    appName: 'Torch Pro',
    permissions: ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION', 'READ_SMS', 'RECEIVE_BOOT_COMPLETED', 'INTERNET', 'FLASHLIGHT'],
    installTime: Date.now() - 86_400_000 * 20,
    lastUpdated: Date.now() - 86_400_000 * 20,
    versionName: '4.2.0',
    isSystemApp: false,
  },
  {
    packageName: 'com.battery.saver.ultra',
    appName: 'Battery Saver Ultra',
    permissions: ['READ_PHONE_STATE', 'SYSTEM_ALERT_WINDOW', 'READ_SMS', 'ACCESS_FINE_LOCATION', 'RECEIVE_BOOT_COMPLETED', 'WAKE_LOCK', 'INTERNET', 'REQUEST_INSTALL_PACKAGES'],
    installTime: Date.now() - 86_400_000 * 8,
    lastUpdated: Date.now() - 86_400_000 * 8,
    versionName: '2.1.0',
    isSystemApp: false,
  },
  {
    packageName: 'com.phone.cleaner.boost',
    appName: 'Phone Cleaner',
    permissions: ['READ_PHONE_STATE', 'SYSTEM_ALERT_WINDOW', 'REQUEST_INSTALL_PACKAGES', 'READ_SMS', 'WRITE_EXTERNAL_STORAGE', 'ACCESS_FINE_LOCATION', 'RECEIVE_BOOT_COMPLETED', 'INTERNET', 'WRITE_SETTINGS'],
    installTime: Date.now() - 86_400_000 * 3,
    lastUpdated: Date.now() - 86_400_000 * 3,
    versionName: '1.0.0',
    isSystemApp: false,
  },
];

function buildProfileId(packageName: string): string {
  return `profile_${packageName.replace(/\./g, '_')}`;
}

function processApp(app: NativeAppData): AppRiskProfile {
  const profile = calculateRiskProfile(
    app.packageName,
    sanitizeAppName(app.appName),
    app.permissions,
    app.installTime,
    app.lastUpdated,
    app.isSystemApp,
    app.versionName,
  );
  return {
    ...profile,
    id: buildProfileId(app.packageName),
  };
}

function buildScanResult(
  profiles: AppRiskProfile[],
  durationMs: number,
  isNative: boolean,
): ScanResult {
  const sorted = [...profiles].sort((a, b) => b.riskScore - a.riskScore);

  return {
    id: `scan_${Date.now()}`,
    scannedAt: new Date(),
    appCount: profiles.length,
    criticalCount: profiles.filter((p) => p.riskTier === 'critical').length,
    highRiskCount: profiles.filter((p) => p.riskTier === 'high').length,
    mediumRiskCount: profiles.filter((p) => p.riskTier === 'medium').length,
    safeCount: profiles.filter((p) => p.riskTier === 'safe' || p.riskTier === 'low').length,
    profiles: sorted,
    overallPrivacyImpact: calculatePrivacyImpact(profiles),
    topThreats: sorted
      .filter((p) => p.threatPatterns.length > 0)
      .slice(0, 3)
      .map((p) => `${p.appName}: ${p.threatPatterns[0].label}`),
    scanDurationMs: durationMs,
    isNativeScan: isNative,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function startPermissionScan(
  onProgress: (p: ScanProgress) => void
): Promise<ScanResult> {
  const startTime = Date.now();
  const apps: NativeAppData[] = [];

  const useNative = NativeScanner !== null && Platform.OS === 'android';

  if (useNative) {
    // Attempt real native scan
    try {
      const hasPerms = await NativeScanner!.hasPermission();
      if (hasPerms) {
        onProgress({ phase: 'enumerating', current: 0, total: 0 });
        await sleep(400);
        const raw = await NativeScanner!.scanInstalledApps();
        apps.push(...raw);
      }
    } catch {
      // Fall through to mock on any native error
    }
  }

  // Use mock data when native is unavailable or returned nothing
  if (apps.length === 0) {
    onProgress({ phase: 'enumerating', current: 0, total: MOCK_APP_SEEDS.length });
    await sleep(700);

    for (let i = 0; i < MOCK_APP_SEEDS.length; i++) {
      apps.push(MOCK_APP_SEEDS[i]);
      onProgress({
        phase: 'analyzing',
        current: i + 1,
        total: MOCK_APP_SEEDS.length,
        currentApp: MOCK_APP_SEEDS[i].appName,
      });
      await sleep(80);
    }
  }

  onProgress({ phase: 'scoring', current: apps.length, total: apps.length });
  await sleep(500);

  const profiles = apps.map(processApp);

  onProgress({ phase: 'complete', current: apps.length, total: apps.length });
  await sleep(300);

  return buildScanResult(profiles, Date.now() - startTime, useNative && apps.length > 0);
}

export function isNativeScannerAvailable(): boolean {
  return NativeScanner !== null && Platform.OS === 'android';
}
