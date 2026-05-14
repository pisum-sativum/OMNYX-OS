// Supabase Realtime subscription lifecycle manager.
//
// SECURITY notes:
// - Only one hardcoded channel is allowed (threat_intelligence_feed).
//   No user-controlled channel names - prevents subscription hijacking.
// - All incoming CDC payloads pass through validateOmnyxEvent before processing.
// - The `source` field is overridden to 'supabase_realtime' regardless of payload contents.
// - Exponential backoff (max 3 retries) prevents connection storms.
// - unsubscribeAll() must be called on app teardown - supabase.removeChannel() prevents leaks.
//
// Supabase schema required for realtime (run in Supabase SQL editor):
//   CREATE TABLE IF NOT EXISTS public.threat_intelligence_feed (
//     id text PRIMARY KEY,
//     type text NOT NULL,
//     severity text NOT NULL,
//     confidence integer NOT NULL DEFAULT 50,
//     source text NOT NULL DEFAULT 'supabase_realtime',
//     title text NOT NULL,
//     description text NOT NULL,
//     "agentTargets" jsonb NOT NULL DEFAULT '[]',
//     "uiReaction" jsonb NOT NULL DEFAULT '{}',
//     payload jsonb NOT NULL DEFAULT '{}',
//     created_at timestamptz NOT NULL DEFAULT now()
//   );
//   ALTER TABLE public.threat_intelligence_feed ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Public read" ON public.threat_intelligence_feed FOR SELECT USING (true);
//   ALTER PUBLICATION supabase_realtime ADD TABLE public.threat_intelligence_feed;

import { supabase } from '@services/supabase';
import type { RealtimeChannel, RealtimePostgresInsertPayload, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { validateOmnyxEvent } from '@/events/eventValidator';
import { eventBus, CHANNELS } from '@/events/eventBus';
import type { OmnyxEvent } from '@/events/types';

const CHANNEL_NAME = 'threat_intelligence_feed';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

class RealtimeManager {
  private channel: RealtimeChannel | null = null;
  private retries = 0;
  private active = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe(onConnected?: () => void): () => void {
    if (this.channel) return () => this.cleanup();
    this.active = true;

    this.channel = supabase
      .channel(CHANNEL_NAME)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: CHANNEL_NAME },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          // Force source - never trust an external payload's self-reported source
          const validated = validateOmnyxEvent({
            ...payload.new,
            source: 'supabase_realtime',
          });
          if (validated) {
            eventBus.emit<OmnyxEvent>(CHANNELS.OMNYX_EVENT, validated);
          }
        }
      )
      .subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
        if (status === 'SUBSCRIBED') {
          this.retries = 0;
          onConnected?.();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.scheduleRetry(onConnected);
        }
      });

    return () => this.cleanup();
  }

  private scheduleRetry(onConnected?: () => void): void {
    if (!this.active || this.retries >= MAX_RETRIES) {
      this.cleanup();
      return;
    }
    this.retries++;
    const delay = BASE_DELAY_MS * Math.pow(2, this.retries - 1);
    this.retryTimer = setTimeout(() => {
      this.cleanup();
      if (this.active) this.subscribe(onConnected);
    }, delay);
  }

  private cleanup(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  unsubscribeAll(): void {
    this.active = false;
    this.cleanup();
  }
}

export const realtimeManager = new RealtimeManager();
