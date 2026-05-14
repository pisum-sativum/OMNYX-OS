// Mounts the ambient engine for the lifetime of the tab navigator.
// Also handles agent reaction lifecycle - activates agents on events, resets them after holdMs.
// Call once from a persistent layout component (tabs _layout).

import { useEffect, useRef } from 'react';
import { useAppStore } from '@store/useAppStore';
import { ambientEngine } from '@services/ambient/ambientEngine';
import { computeAtmosphere } from '@services/ambient/atmosphereEngine';
import { getSwarmReactions } from '@services/ambient/swarmCoordinator';
import type { OmnyxEvent } from '@/events/types';

export function useAmbientSystem(): void {
  const addRealtimeEvent = useAppStore((s) => s.addRealtimeEvent);
  const updateAgent = useAppStore((s) => s.updateAgent);
  const setAtmosphere = useAppStore((s) => s.setAtmosphere);

  // Stable Zustand selectors - read at effect-time, not closure-capture-time
  const privacyScoreRef = useRef(useAppStore.getState().privacyScore.current);
  const privacyModeRef = useRef(useAppStore.getState().privacyMode);
  const recentEventsRef = useRef(useAppStore.getState().recentEvents);

  // Agent reset timers - keyed by agentId
  const agentTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Start ambient engine on mount, stop on unmount
  useEffect(() => {
    ambientEngine.start((event: OmnyxEvent) => {
      addRealtimeEvent(event);

      const reactions = getSwarmReactions(event);
      for (const reaction of reactions) {
        const existing = agentTimers.current.get(reaction.agentId);
        if (existing) clearTimeout(existing);

        updateAgent(reaction.agentId, {
          status: reaction.status,
          currentActivity: reaction.activity,
        });

        const timer = setTimeout(() => {
          agentTimers.current.delete(reaction.agentId);
          updateAgent(reaction.agentId, { status: 'active' });
        }, reaction.holdMs);

        agentTimers.current.set(reaction.agentId, timer);
      }
    });

    return () => {
      ambientEngine.stop();
      agentTimers.current.forEach((t) => clearTimeout(t));
      agentTimers.current.clear();
    };
  }, [addRealtimeEvent, updateAgent]);

  // Sync refs and recompute atmosphere when key state changes
  useEffect(() => {
    return useAppStore.subscribe((state) => {
      const score = state.privacyScore.current;
      const mode = state.privacyMode;
      const events = state.recentEvents;

      const scoreChanged = privacyScoreRef.current !== score;
      const modeChanged = privacyModeRef.current !== mode;
      const eventsChanged = recentEventsRef.current !== events;

      if (!scoreChanged && !modeChanged && !eventsChanged) return;

      privacyScoreRef.current = score;
      privacyModeRef.current = mode;
      recentEventsRef.current = events;

      const { level, intensity } = computeAtmosphere(score, events, mode);
      setAtmosphere(level, intensity);
      ambientEngine.setAtmosphere(level);
    });
  }, [setAtmosphere]);
}
