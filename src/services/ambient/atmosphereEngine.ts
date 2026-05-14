// Computes the current atmospheric tension level from observable state.
// Pure function - no side effects, fully testable.
// Called whenever privacy score, privacy mode, or recent events change.

import type { AtmosphereLevel, OmnyxEvent } from '@/events/types';
import type { PrivacyMode } from '@/types';

const RECENT_WINDOW_MS = 5 * 60_000;

export function computeAtmosphere(
  privacyScore: number,
  recentEvents: OmnyxEvent[],
  privacyMode: PrivacyMode
): { level: AtmosphereLevel; intensity: number } {
  const cutoff = Date.now() - RECENT_WINDOW_MS;
  const recent = recentEvents.filter((e) => e.timestamp > cutoff);

  const criticalCount = recent.filter((e) => e.severity === 'critical').length;
  const highCount = recent.filter((e) => e.severity === 'high').length;
  const mediumCount = recent.filter((e) => e.severity === 'medium').length;

  // Score contribution - lower score = more intense atmosphere
  let intensity = 0;
  if (privacyScore < 30) intensity += 60;
  else if (privacyScore < 50) intensity += 35;
  else if (privacyScore < 70) intensity += 15;

  // Recent event severity weighting
  intensity += Math.min(criticalCount * 20, 40);
  intensity += Math.min(highCount * 12, 30);
  intensity += Math.min(mediumCount * 5, 15);

  // Calm privacy modes dampen the atmosphere significantly
  if (privacyMode === 'ghost' || privacyMode === 'sleep') {
    intensity = Math.round(intensity * 0.35);
  }

  intensity = Math.min(100, Math.max(0, Math.round(intensity)));

  let level: AtmosphereLevel;
  if (intensity >= 75) level = 'critical';
  else if (intensity >= 50) level = 'tense';
  else if (intensity >= 25) level = 'elevated';
  else level = 'calm';

  return { level, intensity };
}
