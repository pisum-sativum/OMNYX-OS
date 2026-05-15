/**
 * Package Monitor Service
 *
 * Wraps the OmnyxPackageMonitor native module (modules/package-monitor).
 * Listens for app install and update events, analyzes the new app's
 * permission profile, and surfaces findings as ThreatEvents.
 *
 * Security notes:
 * - Only available on Android; no-ops on other platforms.
 * - Native module must be registered via expo prebuild before use.
 * - No PII collected. Only package name, app name, and declared permissions.
 * - Analysis is local; no network calls triggered from this module.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { calculateRiskProfile } from './riskEngine';
import { buildInstallThreatEvent } from './privacyIntelligence';
import type { ThreatEvent } from '@/types';

const NativeMonitor = Platform.OS === 'android'
  ? (NativeModules.OmnyxPackageMonitor as { startMonitoring: () => void; stopMonitoring: () => void; addListener: (event: string) => void; removeListeners: (count: number) => void } | null ?? null)
  : null;

type InstallCallback = (threatEvent: ThreatEvent) => void;

let subscription: ReturnType<NativeEventEmitter['addListener']> | null = null;

interface InstallEvent {
  packageName: string;
  appName: string;
  permissions: string[];
  isUpdate: boolean;
  isSystemApp: boolean;
  installTime: number;
}

export function startPackageMonitor(onInstall: InstallCallback): void {
  if (!NativeMonitor) return;

  try {
    NativeMonitor.startMonitoring();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emitter = new NativeEventEmitter(NativeMonitor as any);
    subscription = emitter.addListener('onPackageInstalled', (event: InstallEvent) => {
      if (event.isSystemApp) return;

      const profile = calculateRiskProfile(
        event.packageName,
        event.appName,
        event.permissions,
        event.installTime,
        event.installTime,
        false,
        '',
      );

      const threatEvent = buildInstallThreatEvent(profile);
      if (threatEvent) onInstall(threatEvent);
    });
  } catch {
    // Native module unavailable before prebuild - silent no-op
  }
}

export function stopPackageMonitor(): void {
  subscription?.remove();
  subscription = null;
  try {
    NativeMonitor?.stopMonitoring();
  } catch {
    // silent
  }
}
