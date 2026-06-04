import { View, ScrollView, Text, Dimensions, RefreshControl, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLG,
  Stop,
} from 'react-native-svg';

import { THEMES } from '@/theme';
import { useAppStore } from '@store/useAppStore';
import type { ReplayEvent } from '@/types';

const { width: SW } = Dimensions.get('window');
const CHART_PAD = 18;
const CHART_H = 88;
const CHART_W = SW - 40 - CHART_PAD * 2;

const RISK_COLOR: Record<string, string> = {
  critical: '#FF1144',
  high: '#FF7A00',
  medium: '#F59E0B',
  low: '#3B82F6',
  safe: '#00FF88',
};

function ts(d: Date, timeFormat: '12h' | '24h') {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h'});
}

function buildPath(pts: Array<{ x: number; y: number }>) {
  const T = 0.42;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + T * (pts[i].x - pts[i - 1].x);
    const cp2x = pts[i].x - T * (pts[i].x - pts[i - 1].x);
    d += ` C ${cp1x.toFixed(1)} ${pts[i - 1].y.toFixed(1)}, ${cp2x.toFixed(1)} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d;
}

// ─── Waveform Panel ────────────────────────────────────────────────────────────

function WaveformPanel({ themeId }: { themeId: string }) {
  const C = THEMES[themeId as keyof typeof THEMES].colors;
  const privacyScore = useAppStore((s) => s.privacyScore);
  const scanResult = useAppStore((s) => s.scanResult);

  const prev = scanResult ? privacyScore.previous : 50;
  const curr = scanResult ? privacyScore.current : 50;

  // Smooth ease-in-out interpolation from prev to curr across 7 points
  const RAW = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const smooth = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    return Math.round(prev + (curr - prev) * smooth);
  });

  const pts = RAW.map((v, i) => ({
    x: (i / (RAW.length - 1)) * CHART_W,
    y: CHART_H - (v / 100) * CHART_H,
  }));

  const line = buildPath(pts);
  const last = pts[pts.length - 1];
  const fill = `${line} L ${last.x.toFixed(1)} ${CHART_H} L 0 ${CHART_H} Z`;

  const delta = curr - prev;
  const deltaColor = delta >= 0 ? C.safe : C.threat;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta} pts`;

  const scanX = useSharedValue(0);
  useEffect(() => {
    scanX.value = withRepeat(
      withSequence(
        withTiming(CHART_W, { duration: 3000 }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(scanX);
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scanX.value }],
  }));

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 28 }}>
      <Text style={{ fontSize: 10, letterSpacing: 2.5, color: C.textDim, marginBottom: 10, fontWeight: '600' }}>
        {scanResult ? 'SCORE TREND' : 'SCORE TRACE'}
      </Text>
      <View style={{
        backgroundColor: C.surface1, borderRadius: 16, padding: CHART_PAD,
        borderWidth: 1, borderColor: C.borderDim, overflow: 'hidden',
      }}>
        <View style={{ height: CHART_H }}>
          <Svg width={CHART_W} height={CHART_H} style={{ position: 'absolute' }}>
            <Defs>
              <SvgLG id={`wf_${themeId}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={C.primary} stopOpacity="0.30" />
                <Stop offset="1" stopColor={C.primary} stopOpacity="0.02" />
              </SvgLG>
            </Defs>
            <Path d={fill} fill={`url(#wf_${themeId})`} />
            <Path d={line} stroke={C.primary} strokeWidth="2" fill="none" />
            <Circle cx={last.x} cy={last.y} r={4} fill={C.primary} />
            <Circle cx={last.x} cy={last.y} r={9} fill={C.primary} opacity="0.18" />
          </Svg>
          <Animated.View style={[{
            position: 'absolute', top: 0, left: 0, width: 1.5, height: CHART_H,
            backgroundColor: `${C.primary}80`,
            shadowColor: C.primary,
            shadowOffset: { width: 0, height: 0 }, shadowRadius: 5, shadowOpacity: 0.9,
          }, scanStyle]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ fontSize: 9, color: C.textDim }}>{scanResult ? 'prev' : '--'}</Text>
          <Text style={{ fontSize: 11, color: C.primary, fontWeight: '700' }}>{curr} now</Text>
          <Text style={{ fontSize: 9, color: deltaColor }}>{scanResult ? deltaLabel : '--'}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Memory Node ────────────────────────────────────────────────────────────────

export function MemoryNode({
  event,
  index,
  isLast,
  themeId,
  timeFormat,
}: {
  event: ReplayEvent;
  index: number;
  isLast: boolean;
  themeId: string;
  timeFormat: '12h' | '24h';
}) {
  const C = THEMES[themeId as keyof typeof THEMES].colors;
  const isPositive = event.riskChange < 0;
  const isNeutral = event.riskChange === 0;
  const rc = RISK_COLOR[event.riskLevel] ?? C.textDim;
  const cc = isPositive ? C.safe : isNeutral ? C.textDim : C.threat;
  const ChangeIcon = isPositive ? TrendingDown : isNeutral ? Minus : TrendingUp;

  // Manual entrance - no `entering` prop avoids Reanimated opacity conflicts
  const fadeIn = useSharedValue(0);
  const slideIn = useSharedValue(18);
  // Ring uses only transform (no opacity) to avoid layout-animation conflict
  const ringScale = useSharedValue(1);

  useEffect(() => {
    const t = setTimeout(() => {
      fadeIn.value = withTiming(1, { duration: 320 });
      slideIn.value = withSpring(0, { damping: 18, stiffness: 120 });
      ringScale.value = withRepeat(
        withSequence(
          withTiming(2.6, { duration: 1100 }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );
    }, index * 75);
    return () => {
      clearTimeout(t);
      cancelAnimation(fadeIn);
      cancelAnimation(slideIn);
      cancelAnimation(ringScale);
    };
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateX: slideIn.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View style={[{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 10 }, containerStyle]}>
      {/* Signal spine */}
      <View style={{ alignItems: 'center', marginRight: 14, width: 18 }}>
        <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
          {/* Echo ring - scale only, no opacity */}
          <Animated.View style={[{
            position: 'absolute', width: 14, height: 14, borderRadius: 7,
            borderWidth: 1.5, borderColor: rc,
          }, ringStyle]} />
          {/* Core dot */}
          <View style={{
            width: 12, height: 12, borderRadius: 6, backgroundColor: rc, zIndex: 1,
            shadowColor: rc, shadowOffset: { width: 0, height: 0 }, shadowRadius: 7, shadowOpacity: 1,
          }} />
        </View>
        {!isLast && (
          <View style={{ width: 1.5, flex: 1, backgroundColor: `${rc}28`, marginTop: 4, minHeight: 28 }} />
        )}
      </View>

      {/* Signal packet card */}
      <View style={{
        flex: 1, backgroundColor: C.surface1, borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: `${rc}20`, marginBottom: 4,
      }}>
        <View style={{ height: 1.5, backgroundColor: `${rc}55` }} />
        <View style={{ padding: 13 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 7 }}>
            <View style={{
              paddingHorizontal: 7, paddingVertical: 3,
              backgroundColor: `${rc}18`, borderRadius: 5,
              borderWidth: 1, borderColor: `${rc}28`,
            }}>
              <Text style={{ fontSize: 8, fontWeight: '800', color: rc, letterSpacing: 1.2 }}>
                {event.riskLevel.toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: C.textDim, flex: 1 }}>{ts(event.timestamp, timeFormat)}</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5,
              backgroundColor: `${cc}14`,
            }}>
              <ChangeIcon size={9} color={cc} />
              <Text style={{ fontSize: 10, color: cc, fontWeight: '700' }}>
                {isPositive ? '' : '+'}{event.riskChange}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, fontWeight: '700', color: C.textPrimary, lineHeight: 18, marginBottom: 5 }}>
            {event.title}
          </Text>
          <Text style={{ fontSize: 11, color: C.textSecondary, lineHeight: 16, marginBottom: event.agentResponse ? 10 : 0 }}>
            {event.description}
          </Text>

          {event.agentResponse && (
            <View style={{
              backgroundColor: `${C.primary}0A`, borderRadius: 8, padding: 9,
              borderWidth: 1, borderColor: `${C.primary}18`,
            }}>
              <Text style={{ fontSize: 8, color: C.primary, letterSpacing: 1.5, fontWeight: '700', marginBottom: 4 }}>
                AI RESPONSE
              </Text>
              <Text style={{ fontSize: 11, color: C.primary, lineHeight: 15 }}>
                {event.agentResponse}
              </Text>
            </View>
          )}

          {event.appName && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.textDim }} />
              <Text style={{ fontSize: 9, color: C.textDim }}>{event.appName}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ReplayScreen() {
  const { replayEvents, currentTheme, timeFormat } = useAppStore();
  const C = THEMES[currentTheme].colors;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await useAppStore.getState().loadPersistedState();
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={[`${C.accent}0A`, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{
          paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20,
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: C.textPrimary, letterSpacing: 2, marginBottom: 4 }}>
              MEMORY STREAM
            </Text>
            <Text style={{ fontSize: 11, color: C.textDim }}>
              Signal archive · Intercepted events · Score trace
            </Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            activeOpacity={0.7}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: C.textDim, fontWeight: '600', letterSpacing: 0.5 }}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            Platform.OS !== 'web' ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            ) : undefined
          }
        >
          {Platform.OS === 'web' && refreshing && (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={C.primary} />
            </View>
          )}
          <WaveformPanel themeId={currentTheme} />
          <Text style={{
            fontSize: 10, letterSpacing: 2.5, color: C.textDim,
            marginHorizontal: 20, marginBottom: 16, fontWeight: '600',
          }}>
            SIGNAL ARCHIVE
          </Text>
          {replayEvents.map((ev, i) => (
            <MemoryNode
              key={ev.id}
              event={ev}
              index={i}
              isLast={i === replayEvents.length - 1}
              themeId={currentTheme}
              timeFormat={timeFormat}
            />
          ))}
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ fontSize: 9, color: C.textDim, letterSpacing: 2 }}>
              END OF SIGNAL ARCHIVE
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
