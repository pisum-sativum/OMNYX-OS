import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Zap } from 'lucide-react-native';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import type { ThreatEvent } from '@/types';
import type { ThemeColors } from '@/theme';

const SCAN_PHASES = [
  { agent: 'SENTINEL', label: 'Behavioral pattern analysis...' },
  { agent: 'SCOUT',    label: 'Network signature scan...' },
  { agent: 'ANALYST',  label: 'Synthesizing intelligence...' },
];

// Animated scanning bar - replaces spinner
function IntelligenceScanBar({ color }: { color: string }) {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400 }),
        withTiming(-1, { duration: 0 })
      ),
      -1, false
    );
    return () => cancelAnimation(x);
  }, []);
  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * 120 }],
  }));
  return (
    <View style={{ height: 2, width: 160, backgroundColor: `${color}18`, borderRadius: 1, overflow: 'hidden', marginVertical: 8 }}>
      <Animated.View style={[{
        width: 60, height: 2, borderRadius: 1,
        backgroundColor: color,
        shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowRadius: 6, shadowOpacity: 1,
      }, barStyle]} />
    </View>
  );
}

// Individual agent insight row in the report
function AgentInsightRow({ agent, insight, index, C }: { agent: string; insight: string; index: number; C: ThemeColors }) {
  const agentColors: Record<string, string> = {
    SENTINEL: '#FF6B6B',
    SCOUT: '#00CCFF',
    ANALYST: C.primary,
    GUARDIAN: '#00FF88',
    WATCHER: '#FFB800',
  };
  const color = agentColors[agent] ?? C.primary;

  return (
    <Animated.View entering={FadeInDown.delay(index * 120).springify()} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      <View style={{
        paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5,
        backgroundColor: `${color}15`, borderWidth: 1, borderColor: `${color}30`,
        alignSelf: 'flex-start', marginTop: 1,
      }}>
        <Text style={{ fontSize: 7, fontWeight: '800', color, letterSpacing: 1.2 }}>{agent}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 11, color: C.textSecondary, lineHeight: 16 }}>{insight}</Text>
    </Animated.View>
  );
}

// Confidence bar - animates width from 0 to (value * 40) px in a fixed 40px container
function ConfidenceBar({ value, color }: { value: number; color: string }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(400, withTiming(value * 40, { duration: 900 }));
  }, [value]);
  const barStyle = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <View style={{ height: 2, width: 40, backgroundColor: `${color}18`, borderRadius: 1, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 2, borderRadius: 1, backgroundColor: color, shadowColor: color, shadowRadius: 4, shadowOpacity: 0.8 }, barStyle]} />
    </View>
  );
}

interface AIInsightPanelProps {
  threat: ThreatEvent;
  C: ThemeColors;
}

export function AIInsightPanel({ threat, C }: AIInsightPanelProps) {
  const { state, result, error, analyze } = useAIAnalysis(threat);
  const [expanded, setExpanded] = useState(false);
  const [scanPhaseIndex, setScanPhaseIndex] = useState(0);

  // Cycle scan phase labels during loading
  useEffect(() => {
    if (state !== 'loading') { setScanPhaseIndex(0); return; }
    const interval = setInterval(() => {
      setScanPhaseIndex(i => (i + 1) % SCAN_PHASES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [state]);

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

  if (state === 'loading') {
    const phase = SCAN_PHASES[scanPhaseIndex];
    return (
      <View style={{
        borderRadius: 12, padding: 14,
        backgroundColor: `${C.primary}08`,
        borderWidth: 1, borderColor: `${C.primary}18`,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <View style={{
            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
            backgroundColor: `${C.primary}18`,
          }}>
            <Text style={{ fontSize: 7, fontWeight: '800', color: C.primary, letterSpacing: 1.5 }}>
              {phase.agent}
            </Text>
          </View>
          <Text style={{ fontSize: 10, color: C.textDim }}>{phase.label}</Text>
        </View>
        <IntelligenceScanBar color={C.primary} />
        <Text style={{ fontSize: 8, color: C.textDim, letterSpacing: 1.5, marginTop: 4 }}>
          OMNYX INTELLIGENCE ENGINE ACTIVE
        </Text>
      </View>
    );
  }

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

  if (!result) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={{
      borderRadius: 14, overflow: 'hidden',
      borderWidth: 1, borderColor: `${C.primary}22`,
      backgroundColor: `${C.primary}07`,
    }}>
      {/* Header bar */}
      <View style={{ height: 1.5, backgroundColor: C.primary, opacity: 0.4 }} />

      <View style={{ padding: 14 }}>
        {/* Label row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Brain size={10} color={C.primary} strokeWidth={2} />
            <Text style={{ fontSize: 8, letterSpacing: 2, color: C.primary, fontWeight: '800' }}>
              OMNYX INTELLIGENCE REPORT
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 8, color: C.textDim }}>CONF</Text>
              <View style={{ width: 40 }}>
                <ConfidenceBar value={result.confidence} color={C.primary} />
              </View>
              <Text style={{ fontSize: 8, color: C.primary, fontWeight: '700' }}>
                {Math.round(result.confidence * 100)}%
              </Text>
            </View>
            <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
              {expanded
                ? <ChevronUp size={14} color={C.textDim} />
                : <ChevronDown size={14} color={C.textDim} />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary - always visible */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: C.textPrimary, lineHeight: 19, marginBottom: expanded ? 12 : 0 }}>
          {result.summary}
        </Text>

        {/* Expanded content */}
        {expanded && (
          <Animated.View entering={FadeInDown.springify()}>
            {/* Explanation */}
            <Text style={{ fontSize: 12, color: C.textSecondary, lineHeight: 18, marginBottom: 14 }}>
              {result.explanation}
            </Text>

            {/* Agent insights */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 8, color: C.textDim, letterSpacing: 2, fontWeight: '600', marginBottom: 8 }}>
                SWARM ANALYSIS
              </Text>
              {result.agentInsights.map((a, i) => (
                <AgentInsightRow key={i} agent={a.agent} insight={a.insight} index={i} C={C} />
              ))}
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: C.borderDim, marginBottom: 12 }} />

            {/* Severity reason */}
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 8, color: C.textDim, letterSpacing: 2, fontWeight: '600', marginBottom: 5 }}>
                SEVERITY ASSESSMENT
              </Text>
              <Text style={{ fontSize: 11, color: C.textSecondary, lineHeight: 16 }}>
                {result.severityReason}
              </Text>
            </View>

            {/* Recommended action */}
            <View style={{
              flexDirection: 'row', alignItems: 'flex-start', gap: 8,
              padding: 10, borderRadius: 8,
              backgroundColor: `${C.safe}0C`,
              borderWidth: 1, borderColor: `${C.safe}20`,
            }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.safe, marginTop: 4 }} />
              <Text style={{ flex: 1, fontSize: 11, color: C.safe, lineHeight: 16, fontWeight: '600' }}>
                {result.recommendedAction}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}
