import { useState, useCallback, useRef } from 'react';
import { requestAIAnalysis, type AIAnalysisResult } from '@services/aiProxy';
import type { ThreatEvent } from '@/types';

type AnalysisState = 'idle' | 'loading' | 'success' | 'error';

// Module-level cache: threatId → { result, cachedAt }
const CACHE_TTL_MS = 15 * 60 * 1000;
const analysisCache = new Map<string, { result: AIAnalysisResult; cachedAt: number }>();

export function useAIAnalysis(threat: ThreatEvent) {
  const [state, setState] = useState<AnalysisState>(() => {
    const cached = analysisCache.get(threat.id);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return 'success';
    return 'idle';
  });

  const [result, setResult] = useState<AIAnalysisResult | null>(() => {
    const cached = analysisCache.get(threat.id);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.result;
    return null;
  });

  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const analyze = useCallback(async () => {
    if (inFlight.current || state === 'loading') return;

    // Check cache
    const cached = analysisCache.get(threat.id);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      setResult(cached.result);
      setState('success');
      return;
    }

    inFlight.current = true;
    setState('loading');
    setError(null);

    try {
      const analysis = await requestAIAnalysis(threat);
      analysisCache.set(threat.id, { result: analysis, cachedAt: Date.now() });
      setResult(analysis);
      setState('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      setState('error');
    } finally {
      inFlight.current = false;
    }
  }, [threat.id, state]);

  const reset = useCallback(() => {
    analysisCache.delete(threat.id);
    setState('idle');
    setResult(null);
    setError(null);
  }, [threat.id]);

  return { state, result, error, analyze, reset };
}
