import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AGENT_COLORS } from './IntelligenceScanner';
import type { ThemeColors } from '@/theme';

interface AgentInsight {
  agent: string;
  insight: string;
}

interface SwarmReasoningViewProps {
  insights: AgentInsight[];
  C: ThemeColors;
}

export function SwarmReasoningView({ insights, C }: SwarmReasoningViewProps) {
  return (
    <View>
      <Text style={{
        fontSize: 8, color: C.textDim, letterSpacing: 2.5,
        fontWeight: '600', marginBottom: 10,
      }}>
        SWARM ANALYSIS
      </Text>

      {insights.map((item, i) => {
        const color = AGENT_COLORS[item.agent] ?? C.primary;
        return (
          <Animated.View
            key={`${item.agent}-${i}`}
            entering={FadeInDown.delay(i * 110).springify()}
            style={{
              flexDirection: 'row', gap: 10, marginBottom: 10,
              paddingLeft: 10, borderLeftWidth: 2,
              borderLeftColor: `${color}44`,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 7, fontWeight: '800', color,
                letterSpacing: 1.5, marginBottom: 3,
              }}>
                {item.agent}
              </Text>
              <Text style={{ fontSize: 11, color: C.textSecondary, lineHeight: 16 }}>
                {item.insight}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}
