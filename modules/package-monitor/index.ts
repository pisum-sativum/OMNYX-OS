// TypeScript types for the OmnyxPackageMonitor native module.
// Runtime access is via the expo-modules-core EventEmitter pattern.
// See src/services/packageMonitor.ts for the JS-side wrapper.

export interface PackageInstallEvent {
  packageName: string;
  appName: string;
  permissions: string[];
  isUpdate: boolean;
  isSystemApp: boolean;
  installTime: number;
}

export default null;
