import { View, ScrollView, Text, Dimensions } from 'react-native';
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
  FadeInDown,
} from 'react-native-reanimated';
import { Shield, Wifi, Brain, Zap, Activity, Cpu } from 'lucide-react-native';
import { useEffect } from 'react';

import { THEMES } from '@/theme';
import { useAppStore } from '@store/useAppStore';
import type { AIAgent, AgentStatus } from '@/types';

const { width: SW } = Dimensions.get('window');

const ICON_MAP: Record<string, any> = {
  'shield-alert': Shield,
  network: Wifi,
  brain: Brain,
  zap: Zap,
  activity: Activity,
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  active: 'ACTIVE',
  scanning: 'SCANNING',
  idle: 'IDLE',
  alert: 'ALERT',
};

// ─── Swarm Field ───────────────────────────────────────────────────────────────

const SWARM_W = SW - 40;
const SWARM_H = 180;
const CX = SWARM_W / 2;
const CY = 85;
const R = Math.min(58, CX - 28);

// Pentagon positions (starting from top, clockwise)
const AGENT_POS = Array.from({ length: 5 }, (_, i) => {
  const theta = -Math.PI / 2 + (2 * Math.PI / 5) * i;
  return { x: Math.round(CX + R * Math.cos(theta)), y: Math.round(CY + R * Math.sin(theta)) };
});

// Connection pairs: pentagon + 2 key diagonals
const CONNECTIONS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [0, 3]];

function ConnectionLine({
  x1, y1, x2, y2, color, phase,
}: { x1: number; y1: number; x2: number; y2: number; color: string; phase: number }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;

  const op = useSharedValue(0.10);
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0.38, { duration: 1800 + phase }),
        withTiming(0.10, { duration: 1800 + phase })
      ),
      -1, true
    );
    return () => cancelAnimation(op);
  }, []);

  const s = useAnimatedStyle(() => ({ opacity: op.value }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: mx - len / 2,
      top: my - 0.5,
      width: len,
      height: 1,
      backgroundColor: color,
      transform: [{ rotate: `${angle}deg` }],
    }, s]} />
  );
}

function SwarmDot({ x, y, agent, C }: { x: number; y: number; agent: AIAgent; C: any }) {
  const statusColorMap: Record<AgentStatus, string> = {
    active: C.safe,
    scanning: C.accent,
    idle: C.textDim,
    alert: C.threat,
  };
  const sc = statusColorMap[agent.status];
  const isLive = agent.status !== 'idle';

  // Ring uses scale-only (no opacity) to avoid layout animation conflicts
  const ringScale = useSharedValue(1);
  const duration = 950 + (agent.confidenceScore % 8) * 55;

  useEffect(() => {
    if (isLive) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(3.2, { duration }),
          withTiming(1, { duration: 0 })
        ),
        -1, false
      );
    }
    return () => cancelAnimation(ringScale);
  }, [isLive]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={{ position: 'absolute', left: x - 14, top: y - 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      {/* Echo ring (scale only) */}
      {isLive && (
        <Animated.View style={[{
          position: 'absolute', width: 18, height: 18, borderRadius: 9,
          borderWidth: 1, borderColor: sc,
        }, ringStyle]} />
      )}
      {/* Core */}
      <View style={{
        width: 14, height: 14, borderRadius: 7,
        backgroundColor: agent.color,
        shadowColor: sc, shadowOffset: { width: 0, height: 0 },
        shadowRadius: isLive ? 8 : 3, shadowOpacity: isLive ? 1 : 0.4,
        zIndex: 2,
      }} />
    </View>
  );
}

function SwarmField({ agents, themeId }: { agents: AIAgent[]; themeId: string }) {
  const C = THEMES[themeId as keyof typeof THEMES].colors;
  if (agents.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Cpu color={C.textSecondary} size={32} />
        <Text style={{ color: C.textSecondary, fontSize: 18, marginTop: 8, fontWeight: 'bold' }}>
          AI Swarm Offline
        </Text>
        <Text style={{ color: C.textDim, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
          Agents are initializing. Try restarting the app.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
      <Text style={{ fontSize: 10, letterSpacing: 2.5, color: C.textDim, marginBottom: 10, fontWeight: '600' }}>
        SWARM CONSTELLATION
      </Text>
      <View style={{
        width: SWARM_W, height: SWARM_H,
        backgroundColor: C.surface1,
        borderRadius: 20, borderWidth: 1,
        borderColor: C.borderDim, overflow: 'hidden',
      }}>
        {/* Central glow */}
        <View style={{
          position: 'absolute', left: CX - 40, top: CY - 40,
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: `${C.primary}08`,
        }} />

        {/* Connection lines */}
        {CONNECTIONS.map(([a, b], i) => (
          <ConnectionLine
            key={`${a}-${b}`}
            x1={AGENT_POS[a].x} y1={AGENT_POS[a].y}
            x2={AGENT_POS[b].x} y2={AGENT_POS[b].y}
            color={C.primary}
            phase={i * 200}
          />
        ))}

        {/* Agent dots */}
        {agents.slice(0, 5).map((agent, i) => (
          <SwarmDot
            key={agent.id}
            x={AGENT_POS[i].x}
            y={AGENT_POS[i].y}
            agent={agent}
            C={C}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Status Pulse ──────────────────────────────────────────────────────────────

function StatusPulse({ status, statusColor }: { status: AgentStatus; statusColor: string }) {
  const scale = useSharedValue(1);
  const outerOp = useSharedValue(0.6);
  const isLive = status === 'active' || status === 'scanning' || status === 'alert';

  useEffect(() => {
    if (!isLive) return;
    scale.value = withRepeat(
      withSequence(withTiming(1.8, { duration: 900 }), withTiming(1, { duration: 0 })),
      -1, false
    );
    outerOp.value = withRepeat(
      withSequence(withTiming(0, { duration: 900 }), withTiming(0.6, { duration: 0 })),
      -1, false
    );
  }, [isLive]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: outerOp.value,
  }));

  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      {isLive && (
        <Animated.View style={[{
          position: 'absolute', width: 10, height: 10,
          borderRadius: 5, backgroundColor: statusColor,
        }, ringStyle]} />
      )}
      <View style={{
        width: 10, height: 10, borderRadius: 5, backgroundColor: statusColor,
        shadowColor: statusColor, shadowOffset: { width: 0, height: 0 },
        shadowRadius: 6, shadowOpacity: 0.9, elevation: 6,
      }} />
    </View>
  );
}

// ─── Confidence Bar ────────────────────────────────────────────────────────────

function ConfidenceBar({ value, color, trackColor }: { value: number; color: string; trackColor: string }) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withSpring(value, { damping: 18, stiffness: 60 }); }, [value]);
  const barStyle = useAnimatedStyle(() => ({ width: `${w.value}%` as any }));

  return (
    <View style={{ height: 3, backgroundColor: trackColor, borderRadius: 2, overflow: 'hidden' }}>
      <Animated.View style={[{
        height: 3, borderRadius: 2, backgroundColor: color,
        shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowRadius: 4, shadowOpacity: 0.8,
      }, barStyle]} />
    </View>
  );
}

// ─── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({ agent, index, themeId }: { agent: AIAgent; index: number; themeId: string }) {
  const C = THEMES[themeId as keyof typeof THEMES].colors;
  const Icon = ICON_MAP[agent.iconKey] ?? Shield;
  const statusColorMap: Record<AgentStatus, string> = {
    active: C.safe, scanning: C.accent, idle: C.textDim, alert: C.threat,
  };
  const statusColor = statusColorMap[agent.status];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).springify()}
      style={{
        marginHorizontal: 20, marginBottom: 12, borderRadius: 16,
        borderWidth: 1, borderColor: `${agent.color}22`,
        overflow: 'hidden', backgroundColor: C.surface1,
      }}
    >
      <LinearGradient
        colors={[`${agent.color}0D`, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80 }}
      />
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: `${agent.color}14`, alignItems: 'center', justifyContent: 'center',
            marginRight: 14, borderWidth: 1, borderColor: `${agent.color}28`,
          }}>
            <Icon size={22} color={agent.color} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 2 }}>
              {agent.name}
            </Text>
            <Text style={{ fontSize: 11, color: C.textDim, lineHeight: 15 }}>{agent.role}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 5 }}>
            <StatusPulse status={agent.status} statusColor={statusColor} />
            <Text style={{ fontSize: 9, color: statusColor, fontWeight: '700', letterSpacing: 1 }}>
              {STATUS_LABELS[agent.status]}
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <Text style={{ fontSize: 9, color: C.textDim, letterSpacing: 2 }}>CONFIDENCE</Text>
            <Text style={{ fontSize: 11, color: agent.color, fontWeight: '700' }}>{agent.confidenceScore}%</Text>
          </View>
          <ConfidenceBar value={agent.confidenceScore} color={agent.color} trackColor={C.glass2} />
        </View>

        <View style={{ backgroundColor: C.glass1, borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: 9, color: C.textDim, letterSpacing: 2, marginBottom: 5, fontWeight: '600' }}>
            CURRENT TASK
          </Text>
          <Text style={{ fontSize: 12, color: C.textSecondary, lineHeight: 17 }}>{agent.currentActivity}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{
            width: 5, height: 5, borderRadius: 2.5, backgroundColor: agent.color,
            shadowColor: agent.color, shadowOffset: { width: 0, height: 0 }, shadowRadius: 3, shadowOpacity: 0.8,
          }} />
          <Text style={{ fontSize: 11, color: C.textDim, flex: 1 }}>{agent.lastAction}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function AgentsScreen() {
  const { agents, currentTheme } = useAppStore();
  const C = THEMES[currentTheme].colors;
  const activeCount = agents.filter((a) => a.status !== 'idle').length;

  const headerPulse = useSharedValue(0.4);
  useEffect(() => {
    headerPulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0.4, { duration: 1200 })),
      -1, true
    );
  }, []);

  const headerDotStyle = useAnimatedStyle(() => ({ opacity: headerPulse.value }));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={[`${C.primary}0E`, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: C.textPrimary, letterSpacing: 2, marginBottom: 6 }}>
            AI SWARM
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.View style={[{
              width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary,
              shadowColor: C.primary, shadowOffset: { width: 0, height: 0 }, shadowRadius: 5, shadowOpacity: 1,
            }, headerDotStyle]} />
            <Text style={{ fontSize: 11, color: C.textDim }}>
              {activeCount} of {agents.length} agents operational
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <SwarmField agents={agents} themeId={currentTheme} />
          {agents.map((agent, idx) => (
            <AgentCard key={agent.id} agent={agent} index={idx} themeId={currentTheme} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
