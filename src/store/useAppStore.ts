import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ThreatEvent, AIAgent, PrivacyMode, PrivacyScoreData, ScannedApp, ReplayEvent } from '@/types';
import type { ThemeId } from '@/theme';
import type { ScanResult } from '@/types/permissions';
import type { AtmosphereLevel, OmnyxEvent } from '@/events/types';
import type { AIAnalysisResult } from '@services/aiProxy';
import {
  MOCK_AGENTS,
  MOCK_PRIVACY_SCORE,
  MOCK_THREAT_EVENTS,
  MOCK_REPLAY_EVENTS,
  MOCK_SCANNED_APPS,
} from '@services/mockData';

const MAX_RECENT_EVENTS = 50;

interface AppState {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;

  privacyScore: PrivacyScoreData;
  updatePrivacyScore: (score: Partial<PrivacyScoreData>) => void;

  privacyMode: PrivacyMode;
  setPrivacyMode: (mode: PrivacyMode) => void;

  threatEvents: ThreatEvent[];
  addThreatEvent: (event: ThreatEvent) => void;
  resolveThreat: (id: string) => void;
  unreadThreatCount: number;
  clearUnreadThreats: () => void;

  agents: AIAgent[];
  updateAgent: (id: string, updates: Partial<AIAgent>) => void;

  scannedApps: ScannedApp[];
  setScannedApps: (apps: ScannedApp[]) => void;

  replayEvents: ReplayEvent[];
  addReplayEvent: (event: ReplayEvent) => void;

  // ── Phase 3: Permission scanner state ──────────────────────────────────────
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  scanProgress: number;
  setScanProgress: (progress: number) => void;
  scanPhase: string;
  setScanPhase: (phase: string) => void;
  scanResult: ScanResult | null;
  setScanResult: (result: ScanResult | null) => void;

  // ── Phase 4: Realtime intelligence state ───────────────────────────────────
  atmosphereLevel: AtmosphereLevel;
  atmosphereIntensity: number;
  setAtmosphere: (level: AtmosphereLevel, intensity: number) => void;
  recentEvents: OmnyxEvent[];
  addRealtimeEvent: (event: OmnyxEvent) => void;
  realtimeConnected: boolean;
  setRealtimeConnected: (connected: boolean) => void;

  // ── Phase 5: AI analysis cache ─────────────────────────────────────────────
  aiCache: Record<string, AIAnalysisResult>;
  setAICache: (id: string, result: AIAnalysisResult) => void;
}

export const useAppStore = create<AppState>()(subscribeWithSelector((set) => ({
  currentTheme: 'nebula',
  setTheme: (theme) => set({ currentTheme: theme }),

  privacyScore: MOCK_PRIVACY_SCORE,
  updatePrivacyScore: (score) =>
    set((state) => ({ privacyScore: { ...state.privacyScore, ...score } })),

  privacyMode: 'normal',
  setPrivacyMode: (mode) => set({ privacyMode: mode }),

  threatEvents: MOCK_THREAT_EVENTS,
  addThreatEvent: (event) =>
    set((state) => ({
      threatEvents: [event, ...state.threatEvents],
      unreadThreatCount: state.unreadThreatCount + 1,
    })),
  resolveThreat: (id) =>
    set((state) => ({
      threatEvents: state.threatEvents.map((e) =>
        e.id === id ? { ...e, resolved: true } : e
      ),
    })),
  unreadThreatCount: 2,
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
  setScanResult: (result) => set({ scanResult: result }),

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
})));
