import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ThreatEvent, AIAgent, PrivacyMode, PrivacyScoreData, ScannedApp, ReplayEvent } from '@/types';
import type { ThemeId } from '@/theme';
import type { ScanResult } from '@/types/permissions';
import type { AtmosphereLevel, OmnyxEvent } from '@/events/types';
import type { AIAnalysisResult } from '@services/aiProxy';
import {
  MOCK_AGENTS,
  MOCK_REPLAY_EVENTS,
  MOCK_SCANNED_APPS,
} from '@services/mockData';
import { computePrivacyScore, buildThreatEvents, buildScanOmnyxEvents, buildReplayEvents } from '@services/privacyIntelligence';
import { loadScanState, saveScanState } from '@services/scanPersistence';
import * as Haptics from 'expo-haptics';

const MAX_RECENT_EVENTS = 50;

const DEFAULT_PRIVACY_SCORE: PrivacyScoreData = {
  current: 100,
  previous: 100,
  trend: 'stable',
  breakdown: { permissions: 100, trackers: 100, networkActivity: 100, dataCollection: 100 },
};

interface AppState {
  /** The active visual theme configuration used to style the UI. */
  currentTheme: ThemeId;
  /** Updates the visual theme configuration across all screens. */
  setTheme: (theme: ThemeId) => void;

  /** Current privacy score data including trend direction and category breakdown. */
  privacyScore: PrivacyScoreData;
  /** Modifies selected fields within the privacy score metadata. */
  updatePrivacyScore: (score: Partial<PrivacyScoreData>) => void;

  /** The active device security profile which alters sensor scanning sensitivity. */
  privacyMode: PrivacyMode;
  /** Updates the active security profile mode. */
  setPrivacyMode: (mode: PrivacyMode) => void;

  /** The preference specifying how time should be rendered in event lists. */
  timeFormat: '12h' | '24h';
  /** Sets the user's preferred time layout option. */
  setTimeFormat: (format: '12h' | '24h') => void;

  /** The listing of intercepted high-risk activities and alert entries. */
  threatEvents: ThreatEvent[];
  /** Appends a new potential risk event to the threat log and marks it unread. */
  addThreatEvent: (event: ThreatEvent) => void;
  /** Marks a specific flagged threat as resolved/addressed. */
  resolveThreat: (id: string) => void;
  /** Marks all active threats in the list as resolved and clears the unread count. */
  resolveAllThreats: () => void;
  /** The number of active alert items that have not yet been cleared or reviewed. */
  unreadThreatCount: number;
  /** Resets the badge count for new alerts to zero. */
  clearUnreadThreats: () => void;

  /** The registered AI swarm components and their online status parameters. */
  agents: AIAgent[];
  /** Modifies properties for a specific AI agent node in the swarm. */
  updateAgent: (id: string, updates: Partial<AIAgent>) => void;

  /** The catalog of installed applications examined during privacy audits. */
  scannedApps: ScannedApp[];
  /** Replaces the collection of applications flagged for audit. */
  setScannedApps: (apps: ScannedApp[]) => void;

  /** Historical record of system scans, alerts, and user decisions. */
  replayEvents: ReplayEvent[];
  /** Pushes a new historical scan or alert transaction into the replay queue. */
  addReplayEvent: (event: ReplayEvent) => void;

  // ── Phase 3: Permission scanner state ──────────────────────────────────────
  /** Indicates whether a background privacy inspection is currently running. */
  isScanning: boolean;
  /** Controls the visual and logical state representing an ongoing scan. */
  setIsScanning: (scanning: boolean) => void;
  /** Percentage completion value of the active privacy sweep. */
  scanProgress: number;
  /** Updates the numerical completion ratio for the current inspection scan. */
  setScanProgress: (progress: number) => void;
  /** Text description representing the current category being inspected in the scan. */
  scanPhase: string;
  /** Updates the descriptive text representing the current category being inspected. */
  setScanPhase: (phase: string) => void;
  /** The cumulative data payload returned from the most recent full scan. */
  scanResult: ScanResult | null;
  /** Triggers a full device scan and populates scanResult with real permission data. */
  setScanResult: (result: ScanResult | null) => void;

  // ── Phase 4: Realtime intelligence state ───────────────────────────────────
  /** The aesthetic danger rating calculated from unresolved threat levels. */
  atmosphereLevel: AtmosphereLevel;
  /** Visual vibration or pulse speed scalar corresponding to system alert levels. */
  atmosphereIntensity: number;
  /** Configures both the threat atmospheric level and visual speed modifier. */
  setAtmosphere: (level: AtmosphereLevel, intensity: number) => void;
  /** A sliding window of live intercepted signals and alerts. */
  recentEvents: OmnyxEvent[];
  /** Appends a live telemetry event to the recent signals buffer. */
  addRealtimeEvent: (event: OmnyxEvent) => void;
  /** Specifies whether the live event stream listener is currently active. */
  realtimeConnected: boolean;
  /** Connects or disconnects the live telemetry socket emulation. */
  setRealtimeConnected: (connected: boolean) => void;

  // ── Phase 5: AI analysis cache ─────────────────────────────────────────────
  /** Stored evaluation analysis results received from LLM agents to prevent duplicate calls. */
  aiCache: Record<string, AIAnalysisResult>;
  /** Associates a threat item with its verified AI-generated analysis result. */
  setAICache: (id: string, result: AIAnalysisResult) => void;

  // ── Persistence ────────────────────────────────────────────────────────────
  /** Restores previously saved scan, score, and threat history from local disk storage. */
  loadPersistedState: () => Promise<void>;
}

export const useAppStore = create<AppState>()(subscribeWithSelector((set, get) => ({
  currentTheme: 'nebula',
  setTheme: (theme) => set({ currentTheme: theme }),

  privacyScore: DEFAULT_PRIVACY_SCORE,
  updatePrivacyScore: (score) =>
    set((state) => ({ privacyScore: { ...state.privacyScore, ...score } })),

  privacyMode: 'normal',
  setPrivacyMode: (mode) => set({ privacyMode: mode }),

  timeFormat: '24h',
  setTimeFormat: (format) => set({ timeFormat: format }),

  threatEvents: [],
  addThreatEvent: (event) => {
    if (event.riskLevel === 'critical') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (event.riskLevel === 'high') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    set((state) => ({
      threatEvents: [event, ...state.threatEvents],
      unreadThreatCount: state.unreadThreatCount + 1,
    }));
  },

  resolveThreat: (id) =>
    set((state) => ({
      threatEvents: state.threatEvents.map((e) =>
        e.id === id ? { ...e, resolved: true } : e
      ),
    })),

  resolveAllThreats: () =>
    set((state) => ({
      threatEvents: state.threatEvents.map((event) => ({
        ...event,
        resolved: true,
      })),
      unreadThreatCount: 0,
    })),
  unreadThreatCount: 0,
  clearUnreadThreats: () => set({ unreadThreatCount: 0 }),

  agents: MOCK_AGENTS,
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  scannedApps: MOCK_SCANNED_APPS,
  setScannedApps: (apps) => set({ scannedApps: apps }),

  replayEvents: MOCK_REPLAY_EVENTS,
  addReplayEvent: (event) =>
    set((state) => ({ replayEvents: [event, ...state.replayEvents] })),

  isScanning: false,
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  scanProgress: 0,
  setScanProgress: (progress) => set({ scanProgress: progress }),
  scanPhase: '',
  setScanPhase: (phase) => set({ scanPhase: phase }),
  scanResult: null,
  setScanResult: (result) => {
    if (!result) {
      set({ scanResult: null });
      return;
    }
    const previousScore = get().privacyScore.current;
    const privacyScore = computePrivacyScore(result, previousScore);
    const threatEvents = buildThreatEvents(result);
    const omnyxEvents = buildScanOmnyxEvents(result, threatEvents);
    const replayEvents = buildReplayEvents(result, threatEvents, privacyScore);

    set({
      scanResult: result,
      privacyScore,
      threatEvents,
      replayEvents,
      unreadThreatCount: threatEvents.filter((e) => !e.resolved).length,
    });

    for (const event of omnyxEvents) {
      get().addRealtimeEvent(event);
    }
    saveScanState(result, threatEvents, privacyScore.current).catch(() => {});
  },

  atmosphereLevel: 'calm',
  atmosphereIntensity: 0,
  setAtmosphere: (level, intensity) => set({ atmosphereLevel: level, atmosphereIntensity: intensity }),
  recentEvents: [],
  addRealtimeEvent: (event) =>
    set((state) => ({
      recentEvents: [event, ...state.recentEvents].slice(0, MAX_RECENT_EVENTS),
    })),
  realtimeConnected: false,
  setRealtimeConnected: (connected) => set({ realtimeConnected: connected }),

  aiCache: {},
  setAICache: (id, result) =>
    set((state) => ({ aiCache: { ...state.aiCache, [id]: result } })),

  loadPersistedState: async () => {
    const state = await loadScanState();
    if (!state.scanResult) return;

    const privacyScore = computePrivacyScore(state.scanResult, state.previousScore);
    const threatEvents = state.threatEvents.length > 0
      ? state.threatEvents
      : buildThreatEvents(state.scanResult);
    const replayEvents = buildReplayEvents(state.scanResult, threatEvents, privacyScore);

    set({
      scanResult: state.scanResult,
      privacyScore,
      threatEvents,
      replayEvents,
      unreadThreatCount: threatEvents.filter((e) => !e.resolved).length,
    });
  },
})));
