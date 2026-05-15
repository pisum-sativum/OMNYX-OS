/**
 * Tracker pattern database for OMNYX.
 *
 * Detection methodology: permission-based probabilistic inference.
 * We identify apps whose permission sets match patterns ASSOCIATED WITH
 * known tracker SDK requirements. This is NOT bytecode analysis - we
 * cannot definitively confirm an SDK is present without inspecting the APK.
 * All detections are clearly framed as "consistent with" rather than "confirmed."
 *
 * Data sources: Exodus Privacy public research (exodus-privacy.eu.org),
 * Google Play policy documentation, Android permission documentation.
 *
 * SECURITY: no network calls, no external lookups. Fully local. No PII.
 */

export type TrackerCategory =
  | 'advertising'
  | 'analytics'
  | 'cross_device_profiling'
  | 'location_harvesting'
  | 'social_surveillance'
  | 'fingerprinting'
  | 'data_broker';

export type TrackerRisk = 'critical' | 'high' | 'medium' | 'low';

export interface TrackerPattern {
  id: string;
  name: string;
  company: string;
  category: TrackerCategory;
  riskLevel: TrackerRisk;
  /** Plain-language description of what this tracker does */
  description: string;
  /** Types of data typically collected */
  dataPoints: string[];
  /**
   * Permission combination that strongly suggests this tracker.
   * ALL permissions in a group must be present to match.
   * Multiple groups = any group matching triggers detection.
   */
  permissionGroups: string[][];
  /**
   * Minimum number of matching permissions before considering a match
   * (for broad patterns that should not false-positive on partial matches)
   */
  minMatchCount?: number;
}

/**
 * Known high-risk package names (definitive, not probabilistic).
 * These are the apps themselves, not SDK hosts.
 * Source: public security research and Play Store policy violations.
 */
export const KNOWN_HIGH_RISK_PACKAGES: Record<string, {
  label: string;
  reason: string;
  riskLevel: TrackerRisk;
}> = {
  'com.zhiliaoapp.musically': {
    label: 'TikTok',
    reason: 'Documented collection of device fingerprints, clipboard data, and cross-app behavioral data. Multiple government security advisories issued.',
    riskLevel: 'critical',
  },
  'com.facebook.katana': {
    label: 'Facebook',
    reason: 'Extensive cross-app tracking via Meta SDK embedded in third-party applications. Background location and identity correlation.',
    riskLevel: 'high',
  },
  'com.instagram.android': {
    label: 'Instagram',
    reason: 'Meta platform tracking infrastructure. Background audio access patterns documented by security researchers.',
    riskLevel: 'high',
  },
  'com.whatsapp': {
    label: 'WhatsApp',
    reason: 'Meta infrastructure. Contact graph harvesting. Cross-platform identity correlation with Facebook/Instagram.',
    riskLevel: 'medium',
  },
  'io.faceapp': {
    label: 'FaceApp',
    reason: 'Biometric data (facial scans) transmitted to servers. Limited transparency on data retention and jurisdiction.',
    riskLevel: 'critical',
  },
  'com.truecaller': {
    label: 'Truecaller',
    reason: 'Harvests contact lists from all users including non-users. Creates shadow profiles without consent.',
    riskLevel: 'high',
  },
  'com.snapchat.android': {
    label: 'Snapchat',
    reason: 'Location data collection (Snap Map). Augmented Reality biometric processing. Advertising profile construction.',
    riskLevel: 'medium',
  },
};

/**
 * Tracker permission patterns.
 * Ordered by risk level descending.
 */
export const TRACKER_PATTERNS: TrackerPattern[] = [
  // ── Cross-Device Profiling ──────────────────────────────────────────────────
  {
    id: 'cross_device_profiler',
    name: 'Cross-Device Identity Profiler',
    company: 'Multiple (advertising networks)',
    category: 'cross_device_profiling',
    riskLevel: 'critical',
    description: 'Permission set enables constructing a persistent identity profile that survives app reinstalls and follows the user across devices.',
    dataPoints: ['Device fingerprint', 'Phone identity (IMEI/IMSI)', 'Bluetooth device registry', 'Contact graph', 'Location history'],
    permissionGroups: [
      ['READ_PHONE_STATE', 'BLUETOOTH_SCAN', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION'],
      ['READ_PHONE_STATE', 'BLUETOOTH_SCAN', 'READ_CONTACTS', 'ACCESS_BACKGROUND_LOCATION'],
    ],
  },
  {
    id: 'surveillance_core',
    name: 'Broad Surveillance SDK',
    company: 'Unknown',
    category: 'data_broker',
    riskLevel: 'critical',
    description: 'Combination of audio capture, visual access, location tracking, and contact data enables comprehensive ambient surveillance.',
    dataPoints: ['Audio fingerprint', 'Visual data', 'Real-time location', 'Social graph', 'Behavioral timeline'],
    permissionGroups: [
      ['RECORD_AUDIO', 'CAMERA', 'ACCESS_BACKGROUND_LOCATION', 'READ_CONTACTS'],
      ['RECORD_AUDIO', 'CAMERA', 'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'READ_PHONE_STATE'],
    ],
  },

  // ── Location Harvesting ─────────────────────────────────────────────────────
  {
    id: 'background_location_harvester',
    name: 'Background Location Harvester',
    company: 'Location data brokers',
    category: 'location_harvesting',
    riskLevel: 'critical',
    description: 'Continuous background location polling enables construction of movement profiles, home/work address inference, and behavioral timeline without user awareness.',
    dataPoints: ['GPS coordinates (continuous)', 'Movement patterns', 'Location history', 'Geofencing triggers'],
    permissionGroups: [
      ['ACCESS_BACKGROUND_LOCATION', 'RECEIVE_BOOT_COMPLETED'],
      ['ACCESS_BACKGROUND_LOCATION', 'ACCESS_FINE_LOCATION', 'INTERNET'],
    ],
  },

  // ── Advertising Networks ────────────────────────────────────────────────────
  {
    id: 'meta_sdk_profile',
    name: 'Meta Advertising SDK',
    company: 'Meta (Facebook)',
    category: 'advertising',
    riskLevel: 'high',
    description: 'Permission profile consistent with Meta SDK integration. Enables cross-app behavioral tracking and ad targeting across the Meta network.',
    dataPoints: ['App usage events', 'Purchase signals', 'Device identifiers', 'Behavioral segments'],
    permissionGroups: [
      ['INTERNET', 'ACCESS_NETWORK_STATE', 'READ_PHONE_STATE', 'RECEIVE_BOOT_COMPLETED', 'CAMERA'],
    ],
    minMatchCount: 4,
  },
  {
    id: 'google_advertising_profile',
    name: 'Google Advertising SDK',
    company: 'Google',
    category: 'advertising',
    riskLevel: 'medium',
    description: 'Permission set consistent with Google AdMob or Google Mobile Ads SDK. Collects device and behavioral signals for ad targeting.',
    dataPoints: ['Advertising ID', 'App events', 'Device characteristics', 'Interest segments'],
    permissionGroups: [
      ['INTERNET', 'ACCESS_NETWORK_STATE', 'ACCESS_WIFI_STATE', 'READ_PHONE_STATE'],
    ],
    minMatchCount: 4,
  },
  {
    id: 'attribution_sdk',
    name: 'Mobile Attribution SDK',
    company: 'Attribution networks (Adjust, AppsFlyer, Branch)',
    category: 'analytics',
    riskLevel: 'high',
    description: 'Attribution SDKs track install source and user journey across advertising campaigns. Collects device fingerprint to link pre-install and post-install behavior.',
    dataPoints: ['Install source', 'Campaign attribution', 'Device fingerprint', 'Deep link events', 'Revenue events'],
    permissionGroups: [
      ['READ_PHONE_STATE', 'INTERNET', 'ACCESS_NETWORK_STATE', 'RECEIVE_BOOT_COMPLETED'],
    ],
    minMatchCount: 4,
  },

  // ── Analytics ───────────────────────────────────────────────────────────────
  {
    id: 'behavioral_analytics',
    name: 'Behavioral Analytics SDK',
    company: 'Analytics platforms (Mixpanel, Amplitude, Segment)',
    category: 'analytics',
    riskLevel: 'medium',
    description: 'Tracks detailed user interaction sequences, session lengths, feature usage, and conversion funnels. Builds behavioral profile for product optimization and targeting.',
    dataPoints: ['Session data', 'Event sequences', 'Feature engagement', 'User properties', 'Funnel metrics'],
    permissionGroups: [
      ['INTERNET', 'ACCESS_NETWORK_STATE', 'READ_PHONE_STATE'],
    ],
    minMatchCount: 3,
  },

  // ── Social Surveillance ─────────────────────────────────────────────────────
  {
    id: 'social_graph_harvester',
    name: 'Social Graph Harvester',
    company: 'Social platforms',
    category: 'social_surveillance',
    riskLevel: 'high',
    description: 'Contact list combined with phone identity enables construction of social relationship graphs including non-users who have never consented to data collection.',
    dataPoints: ['Contact list', 'Call patterns', 'Phone numbers', 'Social relationships', 'Communication frequency'],
    permissionGroups: [
      ['READ_CONTACTS', 'READ_PHONE_STATE', 'INTERNET'],
      ['READ_CONTACTS', 'READ_CALL_LOG', 'INTERNET'],
    ],
    minMatchCount: 3,
  },

  // ── Fingerprinting ──────────────────────────────────────────────────────────
  {
    id: 'device_fingerprinter',
    name: 'Device Fingerprinting SDK',
    company: 'Fraud prevention / ad verification networks',
    category: 'fingerprinting',
    riskLevel: 'high',
    description: 'Combination of sensors enables construction of a device fingerprint that persists across app reinstalls and VPN usage. Used for fraud prevention and ad verification but enables persistent tracking.',
    dataPoints: ['Hardware identifiers', 'Network configuration', 'Bluetooth device cache', 'Sensor calibration', 'System configuration'],
    permissionGroups: [
      ['BLUETOOTH_SCAN', 'ACCESS_WIFI_STATE', 'READ_PHONE_STATE', 'ACCESS_NETWORK_STATE'],
    ],
    minMatchCount: 3,
  },

  // ── Data Broker Patterns ────────────────────────────────────────────────────
  {
    id: 'data_broker_aggregate',
    name: 'Data Broker Permission Profile',
    company: 'Data brokers',
    category: 'data_broker',
    riskLevel: 'critical',
    description: 'Permission combination exceeds any legitimate utility or social app requirement. Profile matches data broker aggregation tools that monetize personal data.',
    dataPoints: ['SMS history', 'Call logs', 'Contact details', 'Location history', 'Behavioral data'],
    permissionGroups: [
      ['READ_SMS', 'READ_CALL_LOG', 'READ_CONTACTS', 'INTERNET'],
      ['READ_SMS', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION', 'INTERNET'],
    ],
    minMatchCount: 3,
  },
  {
    id: 'stalkerware_pattern',
    name: 'Elevated Monitoring Profile',
    company: 'Surveillance software vendors',
    category: 'data_broker',
    riskLevel: 'critical',
    description: 'Permission cluster is consistent with stalkerware or parental monitoring software. Enables covert tracking of calls, messages, location, and contacts.',
    dataPoints: ['SMS content', 'Call history', 'Real-time location', 'Contacts', 'App activity'],
    permissionGroups: [
      ['READ_SMS', 'RECEIVE_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'READ_CONTACTS'],
      ['BIND_ACCESSIBILITY_SERVICE', 'ACCESS_BACKGROUND_LOCATION', 'READ_SMS'],
    ],
    minMatchCount: 3,
  },
];

export interface TrackerDetectionResult {
  appName: string;
  packageName: string;
  matchedPatterns: Array<{
    pattern: TrackerPattern;
    matchedPermissions: string[];
    confidence: 'probable' | 'likely' | 'possible';
  }>;
  knownPackageRisk?: typeof KNOWN_HIGH_RISK_PACKAGES[string];
  overallRisk: TrackerRisk;
}
