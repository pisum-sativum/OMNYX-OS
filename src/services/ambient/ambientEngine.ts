/**
 * Ambient Engine - Real Signal Reactor
 *
 * OMNYX v2 architecture: synthetic event generation removed.
 *
 * The previous implementation generated fake threat events on a timer to make
 * the app feel alive. That approach was dishonest - it implied real detections
 * that did not exist and created false urgency. Removed entirely.
 *
 * Atmosphere state is now driven exclusively by:
 *   - Real privacy score computed from actual device scan
 *   - Real threat events from permission scanner output
 *   - Real install events from PackageMonitor native module
 *
 * When nothing real has happened, OMNYX stays calm.
 * That is the honest and correct behavior.
 */

import type { AtmosphereLevel } from '@/events/types';

class AmbientEngine {
  private _currentAtmosphere: AtmosphereLevel = 'calm';

  // Signature kept for backward compatibility with useAmbientSystem hook.
  // The callback is never invoked since no synthetic events are generated.
  start(_onEvent: unknown): void {
    // Intentionally empty. Real events come from permission_scan and user_action sources.
  }

  stop(): void {
    // Nothing to clean up.
  }

  setAtmosphere(level: AtmosphereLevel): void {
    this._currentAtmosphere = level;
  }

  get currentAtmosphere(): AtmosphereLevel {
    return this._currentAtmosphere;
  }
}

export const ambientEngine = new AmbientEngine();
