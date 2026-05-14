import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { ConfidenceMeter } from './ConfidenceMeter';
import { SwarmReasoningView } from './SwarmReasoningView';
import type { ThemeColors } from '@/theme';
import type { AIAnalysisResult } from '@/services/aiProxy';

interface ThreatExplanationCardProps {
  result: AIAnalysisResult;
  C: ThemeColors;
}

export function ThreatExplanationCard({ result, C }: ThreatExplanationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{
      borderRadius: 14, overflow: 'hidden',
      borderWidth: 1, borderColor: `${C.primary}22`,
      backgroundColor: `${C.primary}07`,
    }}>
      {/* Top accent line */}
      <View style={{ height: 1.5, backgroundColor: C.primary, opacity: 0.4 }} />

      <View style={{ padding: 14 }}>
        {/* Header row */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 11,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Brain size={10} color={C.primary} strokeWidth={2} />
            <Text style={{
              fontSize: 8, letterSpacing: 2.2, color: C.primary, fontWeight: '800',
            }}>
              INTELLIGENCE REPORT
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setExpanded(e => !e)}
            activeOpacity={0.7}
            style={{ padding: 4 }}
          >
            {expanded
              ? <ChevronUp size={14} color={C.textDim} />
              : <ChevronDown size={14} color={C.textDim} />
            }
          </TouchableOpacity>
        </View>

        {/* Confidence */}
        <View style={{ marginBottom: 12 }}>
          <ConfidenceMeter value={result.confidence} primary={C.primary} />
        </View>

        {/* Summary - always visible */}
        <Text style={{
          fontSize: 13, fontWeight: '700', color: C.textPrimary,
          lineHeight: 20, marginBottom: expanded ? 14 : 0,
        }}>
          {result.summary}
        </Text>

        {/* Expanded section - FadeInDown only, no opacity useAnimatedStyle here */}
        {expanded && (
          <Animated.View entering={FadeInDown.duration(280)}>

            {/* Explanation */}
            <Text style={{
              fontSize: 12, color: C.textSecondary, lineHeight: 19, marginBottom: 14,
            }}>
              {result.explanation}
            </Text>

            {/* Behavioral signatures */}
            {result.behavioralObservations.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{
                  fontSize: 8, color: C.textDim, letterSpacing: 2.5,
                  fontWeight: '600', marginBottom: 8,
                }}>
                  BEHAVIORAL SIGNATURES
                </Text>
                {result.behavioralObservations.map((obs, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row', alignItems: 'flex-start',
                      gap: 8, marginBottom: 6,
                    }}
                  >
                    <View style={{
                      width: 3, height: 3, borderRadius: 1.5,
                      backgroundColor: C.accent, marginTop: 5,
                    }} />
                    <Text style={{ flex: 1, fontSize: 11, color: C.textSecondary, lineHeight: 17 }}>
                      {obs}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Swarm reasoning */}
            <View style={{ marginBottom: 14 }}>
              <SwarmReasoningView insights={result.agentInsights} C={C} />
            </View>

            <View style={{ height: 1, backgroundColor: C.borderDim, marginBottom: 12 }} />

            {/* Severity assessment */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{
                fontSize: 8, color: C.textDim, letterSpacing: 2.5,
                fontWeight: '600', marginBottom: 5,
              }}>
                SEVERITY ASSESSMENT
              </Text>
              <Text style={{ fontSize: 11, color: C.textSecondary, lineHeight: 17 }}>
                {result.severityReason}
              </Text>
            </View>

            {/* Recommended action */}
            <View style={{
              flexDirection: 'row', alignItems: 'flex-start', gap: 8,
              padding: 10, borderRadius: 8,
              backgroundColor: `${C.safe}0C`,
              borderWidth: 1, borderColor: `${C.safe}22`,
            }}>
              <View style={{
                width: 4, height: 4, borderRadius: 2,
                backgroundColor: C.safe, marginTop: 4,
              }} />
              <Text style={{
                flex: 1, fontSize: 11, color: C.safe, lineHeight: 17, fontWeight: '600',
              }}>
                {result.recommendedAction}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
