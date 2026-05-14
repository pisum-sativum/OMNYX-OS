import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const BAR_MAX_W = 100;

function confidenceColor(value: number): string {
  if (value >= 0.82) return '#00FF88';
  if (value >= 0.62) return '#FFBB00';
  return '#FF6B6B';
}

interface ConfidenceMeterProps {
  value: number;
  primary: string;
}

export function ConfidenceMeter({ value, primary }: ConfidenceMeterProps) {
  const pct    = Math.round(value * 100);
  const color  = confidenceColor(value);
  const barW   = useSharedValue(0);

  useEffect(() => {
    barW.value = withDelay(200, withTiming(value * BAR_MAX_W, { duration: 900 }));
    return () => cancelAnimation(barW);
  }, [value]);

  const barStyle = useAnimatedStyle(() => ({ width: barW.value }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ fontSize: 8, color: `${primary}77`, letterSpacing: 1.5, width: 30 }}>
        CONF
      </Text>
      <View style={{
        width: BAR_MAX_W, height: 3,
        backgroundColor: `${primary}14`, borderRadius: 2, overflow: 'hidden',
      }}>
        <Animated.View style={[{
          height: 3, borderRadius: 2,
          backgroundColor: color,
          shadowColor: color, shadowOffset: { width: 0, height: 0 },
          shadowRadius: 6, shadowOpacity: 0.8,
        }, barStyle]} />
      </View>
      <Text style={{ fontSize: 10, fontWeight: '700', color, width: 36, textAlign: 'right' }}>
        {pct}%
      </Text>
    </View>
  );
}
