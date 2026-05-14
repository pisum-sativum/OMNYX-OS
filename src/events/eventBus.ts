// Process-local pub/sub for OMNYX realtime events.
// Immune to external injection - no network, no IPC.
// SECURITY: listener cap prevents unbounded memory growth from leaks.

type Listener<T = unknown> = (event: T) => void;

const MAX_LISTENERS_PER_CHANNEL = 20;

class EventBus {
  private readonly listeners = new Map<string, Set<Listener>>();

  on<T>(channel: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    const set = this.listeners.get(channel)!;
    if (set.size >= MAX_LISTENERS_PER_CHANNEL) {
      // Defensive cap - indicates a leak in calling code
      return () => {};
    }
    set.add(listener as Listener);
    return () => this.off(channel, listener as Listener);
  }

  emit<T>(channel: string, payload: T): void {
    this.listeners.get(channel)?.forEach((l) => {
      try {
        l(payload);
      } catch {
        // Isolate listener errors - one bad listener never breaks the bus
      }
    });
  }

  off(channel: string, listener: Listener): void {
    this.listeners.get(channel)?.delete(listener);
  }

  clear(channel?: string): void {
    if (channel) {
      this.listeners.delete(channel);
    } else {
      this.listeners.clear();
    }
  }
}

export const eventBus = new EventBus();

export const CHANNELS = {
  OMNYX_EVENT: 'omnyx:event',
  ATMOSPHERE_CHANGE: 'omnyx:atmosphere',
  SWARM_REACTION: 'omnyx:swarm',
} as const;
