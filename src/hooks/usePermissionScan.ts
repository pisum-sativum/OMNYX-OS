import { useCallback } from 'react';
import { useAppStore } from '@store/useAppStore';
import { startPermissionScan, isNativeScannerAvailable } from '@services/permissionScanner';
import type { ScanProgress } from '@/types/permissions';

export function usePermissionScan() {
  const {
    isScanning,
    setScanPhase,
    setScanProgress,
    setIsScanning,
    setScanResult,
  } = useAppStore();

  const startScan = useCallback(async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanPhase('INITIALIZING...');

    try {
      const result = await startPermissionScan((progress: ScanProgress) => {
        const pct = progress.total > 0
          ? Math.round((progress.current / progress.total) * 100)
          : 0;

        setScanProgress(pct);

        switch (progress.phase) {
          case 'enumerating':
            setScanPhase('ENUMERATING PACKAGES...');
            break;
          case 'analyzing':
            setScanPhase(
              progress.currentApp
                ? `ANALYZING ${progress.currentApp.toUpperCase()}...`
                : 'ANALYZING PERMISSIONS...'
            );
            break;
          case 'scoring':
            setScanPhase('COMPUTING RISK SCORES...');
            break;
          case 'complete':
            setScanPhase('SCAN COMPLETE');
            setScanProgress(100);
            break;
        }
      });

      setScanResult(result);
    } catch {
      setScanPhase('SCAN ERROR');
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  return {
    startScan,
    isScanning,
    isNativeAvailable: isNativeScannerAvailable(),
  };
}
