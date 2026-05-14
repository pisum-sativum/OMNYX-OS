// Optional Supabase Realtime subscription.
// Gracefully degrades to ambient-only mode when EXPO_PUBLIC_SUPABASE_URL is not set.
// SECURITY: only subscribes when URL is configured; always cleans up on unmount.

import { useEffect } from 'react';
import { useAppStore } from '@store/useAppStore';
import { realtimeManager } from '@services/realtime/realtimeManager';
import { eventBus, CHANNELS } from '@/events/eventBus';
import type { OmnyxEvent } from '@/events/types';

export function useRealtimeEvents(): { isConnected: boolean } {
  const addRealtimeEvent = useAppStore((s) => s.addRealtimeEvent);
  const setRealtimeConnected = useAppStore((s) => s.setRealtimeConnected);
  const isConnected = useAppStore((s) => s.realtimeConnected);

  useEffect(() => {
    // Graceful degradation: skip Supabase if URL is missing or a placeholder value
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
    if (!url.startsWith('https://') && !url.startsWith('http://')) return;

    const unsubscribeChannel = realtimeManager.subscribe(() => {
      setRealtimeConnected(true);
    });

    // Only process events that came from Supabase (not ambient engine events)
    const unlistenEvents = eventBus.on<OmnyxEvent>(CHANNELS.OMNYX_EVENT, (event) => {
      if (event.source === 'supabase_realtime') {
        addRealtimeEvent(event);
      }
    });

    return () => {
      unsubscribeChannel();
      unlistenEvents();
      setRealtimeConnected(false);
    };
  }, [addRealtimeEvent, setRealtimeConnected]);

  return { isConnected };
}
