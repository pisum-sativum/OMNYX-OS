// TypeScript stub for the OmnyxPermissionScanner native module.
// The actual implementation is in android/src/.../PermissionScannerModule.kt
// This file exists so TypeScript consumers can reference the module type.
// The runtime module is accessed via NativeModules.OmnyxPermissionScanner in permissionScanner.ts.

export interface NativePermissionScanner {
  hasPermission(): Promise<boolean>;
  scanInstalledApps(): Promise<
    Array<{
      packageName: string;
      appName: string;
      permissions: string[];
      installTime: number;
      lastUpdated: number;
      versionName: string;
      isSystemApp: boolean;
    }>
  >;
}

export default null;
