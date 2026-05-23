import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export const SCAN_PHASES = [
  { agent: 'SENTINEL', label: 'Anomaly boundary scan...' },
  { agent: 'SCOUT',    label: 'Network signature analysis...' },
  { agent: 'ANALYST',  label: 'Pattern correlation...' },
  { agent: 'ORACLE',   label: 'Predictive risk modeling...' },
  { agent: 'PHANTOM',  label: 'Covert behavior detection...' },
] as const;

export const AGENT_COLORS: Record<string, string> = {
  SENTINEL: '#FF6B6B',
  SCOUT:    '#00CCFF',
  ANALYST:  '#9966FF',
  ORACLE:   '#BB88FF',
  PHANTOM:  '#00FF88',
};

interface IntelligenceScannerProps {
  primary: string;
  phaseIndex: number;
}

export function IntelligenceScanner({ primary, phaseIndex }: IntelligenceScannerProps) {
  const phase = SCAN_PHASES[phaseIndex % SCAN_PHASES.length];
  const agentColor = AGENT_COLORS[phase.agent] ?? primary;

  const beam1X  = useSharedValue(-100);
  const beam2X  = useSharedValue(-100);
  const particleX = useSharedValue(-80);
  const cursorOp  = useSharedValue(1);

  useEffect(() => {
    beam1X.value = withRepeat(
      withSequence(withTiming(160, { duration: 1100 }), withTiming(-100, { duration: 0 })),
      -1, false
    );
    beam2X.value = withDelay(380, withRepeat(
      withSequence(withTiming(160, { duration: 1100 }), withTiming(-100, { duration: 0 })),
      -1, false
    ));
    particleX.value = withRepeat(
      withSequence(withTiming(200, { duration: 720 }), withTiming(-80, { duration: 0 })),
      -1, false
    );
    cursorOp.value = withRepeat(
      withSequence(withTiming(0, { duration: 480 }), withTiming(1, { duration: 480 })),
      -1, true
    );
    return () => {
      cancelAnimation(beam1X);
      cancelAnimation(beam2X);
      cancelAnimation(particleX);
      cancelAnimation(cursorOp);
    };
  }, []);

  const beam1Style    = useAnimatedStyle(() => ({ transform: [{ translateX: beam1X.value }] }));
  const beam2Style    = useAnimatedStyle(() => ({ transform: [{ translateX: beam2X.value }] }));
  const particleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: particleX.value }] }));
  const cursorStyle   = useAnimatedStyle(() => ({ opacity: cursorOp.value }));

  return (
    <View>
      {/* Agent label + phase text + blinking cursor */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 }}>
        <View style={{
          paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
          backgroundColor: `${agentColor}18`, borderWidth: 1, borderColor: `${agentColor}35`,
        }}>
          <Text style={{ fontSize: 8, fontWeight: '800', color: agentColor, letterSpacing: 1.5 }}>
            {phase.agent}
          </Text>
        </View>
        <Text style={{ flex: 1, fontSize: 10, color: `${primary}88` }}>
          {phase.label}
        </Text>
        {/* blinking cursor - opacity via useAnimatedStyle, no entering prop here */}
        <Animated.View style={[{ width: 5, height: 11, backgroundColor: primary, borderRadius: 1 }, cursorStyle]} />
      </View>

      {/* Primary scan track */}
      <View style={{
        height: 2, backgroundColor: `${primary}14`, borderRadius: 1,
        overflow: 'hidden', marginBottom: 5,
      }}>
        <Animated.View style={[{
          position: 'absolute', width: 72, height: 2, borderRadius: 1,
          backgroundColor: agentColor,
          shadowColor: agentColor, shadowOffset: { width: 0, height: 0 },
          shadowRadius: 8, shadowOpacity: 1,
        }, beam1Style]} />
        <Animated.View style={[{
          position: 'absolute', width: 40, height: 2, borderRadius: 1,
          backgroundColor: `${agentColor}55`,
        }, beam2Style]} />
      </View>

      {/* Secondary particle track */}
      <View style={{
        height: 1, backgroundColor: `${primary}08`, borderRadius: 1,
        overflow: 'hidden', marginBottom: 10,
      }}>
        <Animated.View style={[{
          position: 'absolute', width: 18, height: 1,
          backgroundColor: `${primary}66`, borderRadius: 1,
        }, particleStyle]} />
      </View>

      <Text style={{ fontSize: 8, color: `${primary}44`, letterSpacing: 2.5, fontWeight: '600' }}>
        OMNYX INTELLIGENCE ENGINE ACTIVE
      </Text>
    </View>
  );
}
