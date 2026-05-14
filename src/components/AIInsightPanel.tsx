import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Brain, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { IntelligenceScanner, SCAN_PHASES } from './IntelligenceScanner';
import { ThreatExplanationCard } from './ThreatExplanationCard';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import type { ThreatEvent } from '@/types';
import type { ThemeColors } from '@/theme';

interface AIInsightPanelProps {
  threat: ThreatEvent;
  C: ThemeColors;
}

export function AIInsightPanel({ threat, C }: AIInsightPanelProps) {
  const { state, result, error, analyze } = useAIAnalysis(threat);
  const [phaseIndex, setPhaseIndex] = useState(0);

  // Cycle swarm agent phases during loading
  useEffect(() => {
    if (state !== 'loading') { setPhaseIndex(0); return; }
    const id = setInterval(() => setPhaseIndex(i => (i + 1) % SCAN_PHASES.length), 1500);
    return () => clearInterval(id);
  }, [state]);

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <TouchableOpacity
        onPress={analyze}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
          backgroundColor: `${C.primary}0C`,
          borderWidth: 1, borderColor: `${C.primary}25`,
          alignSelf: 'flex-start',
        }}
      >
        <Brain size={11} color={C.primary} strokeWidth={2} />
        <Text style={{ fontSize: 10, color: C.primary, fontWeight: '700', letterSpacing: 1 }}>
          REQUEST ANALYSIS
        </Text>
        <Zap size={9} color={C.primary} strokeWidth={2} />
      </TouchableOpacity>
    );
  }

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <View style={{
        borderRadius: 12, padding: 14,
        backgroundColor: `${C.primary}08`,
        borderWidth: 1, borderColor: `${C.primary}18`,
      }}>
        <IntelligenceScanner primary={C.primary} phaseIndex={phaseIndex} />
      </View>
    );
  }

  // ── ERROR ────────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <TouchableOpacity
        onPress={analyze}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
          backgroundColor: `${C.threat}0C`,
          borderWidth: 1, borderColor: `${C.threat}25`,
        }}
      >
        <Text style={{ fontSize: 10, color: C.threat, fontWeight: '600' }}>
          {error ?? 'Analysis failed'} - Retry
        </Text>
      </TouchableOpacity>
    );
  }

  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (!result) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <ThreatExplanationCard result={result} C={C} />
    </Animated.View>
  );
}
