import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useState, useEffect, useRef } from 'react';
import Svg, {
  Circle,
  Ellipse,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  Rect,
  Pattern,
} from 'react-native-svg';
import {
  ChevronDown,
  AlertTriangle,
  Mic,
  Clipboard,
  Globe,
  MapPin,
  Camera,
  Activity,
  Shield,
  Wifi,
  Brain,
  Zap,
  EyeOff,
  Lock,
  Moon,
  ShieldCheck,
  Check,
} from 'lucide-react-native';

import { THEMES, THEME_LIST } from '@/theme';
import type { ThemeId } from '@/theme';
import { useAppStore } from '@store/useAppStore';
import type { ThreatEventType, PrivacyMode } from '@/types';
import type { AtmosphereLevel } from '@/events/types';

const PULSE_DURATIONS: Record<AtmosphereLevel, number> = {
  calm: 2200,
  elevated: 1400,
  tense: 700,
  critical: 360,
};

const ORBIT_DURATIONS: Record<AtmosphereLevel, number> = {
  calm: 12000,
  elevated: 8500,
  tense: 5000,
  critical: 2800,
};

const SEVERITY_COLORS: Record<string, string> = {
  info: '#888888',
  low: '#3B82F6',
  medium: '#F59E0B',
  high: '#FF7A00',
  critical: '#FF3B5C',
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const RING_CONFIGS: Record<ThemeId, { size: number; stroke: number }> = {
  nebula:     { size: SCREEN_W * 0.60, stroke: 11 },
  lumina:     { size: SCREEN_W * 0.54, stroke: 5  },
  terminal:   { size: SCREEN_W * 0.60, stroke: 10 },
  solaris:    { size: SCREEN_W * 0.60, stroke: 11 },
  glassmorph: { size: SCREEN_W * 0.60, stroke: 7  },
};

// Agent display names mapped by iconKey
const AGENT_DISPLAY: Record<string, string> = {
  'shield-alert': 'SENTINEL',
  network:        'SCOUT',
  brain:          'ANALYST',
  zap:            'GUARDIAN',
  activity:       'WATCHER',
};

const NEBULA_STARS = Array.from({ length: 60 }, (_, i) => ({
  x: Math.abs((i * 137.508 * 7 + 40) % (SCREEN_W - 20)) + 10,
  y: Math.abs((i * 97.37 * 11 + 60) % (SCREEN_H * 0.7)) + 40,
  r: i % 5 === 0 ? 1.5 : i % 3 === 0 ? 1.2 : 0.8,
  opacity: 0.06 + (i % 6) * 0.045,
}));

const EVENT_ICONS: Record<ThreatEventType, any> = {
  microphone_access: Mic,
  camera_access: Camera,
  clipboard_read: Clipboard,
  location_access: MapPin,
  network_request: Globe,
  tracker_detected: Activity,
  suspicious_permission: AlertTriangle,
  background_activity: Activity,
};

const AGENT_ICONS: Record<string, any> = {
  'shield-alert': Shield,
  network: Wifi,
  brain: Brain,
  zap: Zap,
  activity: Activity,
};

function scoreLabel(score: number): string {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'STRONG';
  if (score >= 60) return 'MODERATE';
  if (score >= 40) return 'AT RISK';
  return 'CRITICAL';
}

interface ModeConfig {
  id: PrivacyMode;
  label: string;
  icon: any;
  color: string;
  description: string;
  perks: string[];
}

const buildModeConfigs = (primary: string, accent: string): ModeConfig[] => [
  {
    id: 'ghost',
    label: 'Ghost',
    icon: EyeOff,
    color: '#7788AA',
    description: 'Tracker risk detection at maximum sensitivity.',
    perks: ['Tracker risks flagged', 'High-risk apps surfaced', 'Permission analysis on'],
  },
  {
    id: 'banking',
    label: 'Banking',
    icon: Lock,
    color: '#22C55E',
    description: 'Heightened detection for financial sessions.',
    perks: ['High-risk apps flagged', 'Clipboard risks tracked', 'Network risks surfaced'],
  },
  {
    id: 'normal',
    label: 'Normal',
    icon: Shield,
    color: primary,
    description: 'Balanced privacy intelligence active.',
    perks: ['Permission scan on', 'Tracker detection on', 'Risk analysis ready'],
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: Globe,
    color: '#FF7A00',
    description: 'Enhanced detection for untrusted environments.',
    perks: ['Location risks surfaced', 'Network risk analysis', 'Tracker detection on'],
  },
  {
    id: 'focus',
    label: 'Focus',
    icon: Zap,
    color: accent,
    description: 'Distraction risk flagging active.',
    perks: ['Distraction apps flagged', 'Notifications filtered', 'Quiet scan mode'],
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: Moon,
    color: '#9966FF',
    description: 'Silent monitoring. Ultra-low battery drain.',
    perks: ['Silent monitoring', 'Low power mode', 'Background risk alerts on'],
  },
];

// ─── Floating Orb (ambient drift) ─────────────────────────────────────────────

function FloatingOrb({ style, children, period = 4500 }: { style: any; children: React.ReactNode; period?: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(11, { duration: period }),
        withTiming(-7, { duration: Math.round(period * 0.88) })
      ),
      -1, true
    );
    return () => cancelAnimation(y);
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

// ─── Atmosphere Shift overlay ──────────────────────────────────────────────────

function AtmosphereShiftOverlay({ scale, opacity, color }: {
  scale: ReturnType<typeof useSharedValue<number>>;
  opacity: ReturnType<typeof useSharedValue<number>>;
  color: string;
}) {
  const s = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{
        position: 'absolute',
        width: SCREEN_W * 2.5,
        height: SCREEN_W * 2.5,
        borderRadius: SCREEN_W * 1.25,
        backgroundColor: color,
        left: -SCREEN_W * 0.75,
        top: SCREEN_H * 0.25 - SCREEN_W * 1.25,
        zIndex: 60,
      }, s]}
    />
  );
}

// ─── Ambient Backgrounds ───────────────────────────────────────────────────────

function NebulaBg() {
  return (
    <>
      <FloatingOrb
        period={5200}
        style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: 160, overflow: 'hidden' }}
      >
        <LinearGradient colors={['rgba(110,40,255,0.32)', 'rgba(110,40,255,0)']} style={{ flex: 1 }} />
      </FloatingOrb>
      <FloatingOrb
        period={6800}
        style={{ position: 'absolute', top: 260, left: -100, width: 260, height: 260, borderRadius: 130, overflow: 'hidden' }}
      >
        <LinearGradient colors={['rgba(60,0,200,0.22)', 'rgba(60,0,200,0)']} style={{ flex: 1 }} />
      </FloatingOrb>
      <FloatingOrb
        period={7500}
        style={{ position: 'absolute', bottom: 200, right: -60, width: 200, height: 200, borderRadius: 100, overflow: 'hidden' }}
      >
        <LinearGradient colors={['rgba(140,60,255,0.15)', 'rgba(140,60,255,0)']} style={{ flex: 1 }} />
      </FloatingOrb>
      <Svg style={{ position: 'absolute', top: 0, left: 0 }} width={SCREEN_W} height={SCREEN_H} pointerEvents="none">
        {NEBULA_STARS.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
        ))}
      </Svg>
    </>
  );
}

function TerminalBg() {
  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0 }} width={SCREEN_W} height={SCREEN_H} pointerEvents="none">
      <Defs>
        <Pattern id="termGrid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <Circle cx="2" cy="2" r="0.8" fill="#00FF41" opacity="0.12" />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#termGrid)" />
    </Svg>
  );
}

function GlassmorphBg() {
  return (
    <>
      <View style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: 150, overflow: 'hidden' }}>
        <LinearGradient colors={['rgba(200,80,160,0.40)', 'rgba(200,80,160,0)']} style={{ flex: 1 }} />
      </View>
      <View style={{ position: 'absolute', bottom: 180, left: -80, width: 260, height: 260, borderRadius: 130, overflow: 'hidden' }}>
        <LinearGradient colors={['rgba(60,80,240,0.36)', 'rgba(60,80,240,0)']} style={{ flex: 1 }} />
      </View>
      <View style={{ position: 'absolute', top: 220, right: 30, width: 180, height: 180, borderRadius: 90, overflow: 'hidden' }}>
        <LinearGradient colors={['rgba(150,60,255,0.26)', 'rgba(150,60,255,0)']} style={{ flex: 1 }} />
      </View>
    </>
  );
}

function SolarisBg() {
  return (
    <View style={{ position: 'absolute', top: -120, left: SCREEN_W / 2 - 200, width: 400, height: 400, borderRadius: 200, overflow: 'hidden' }}>
      <LinearGradient colors={['rgba(255,100,0,0.22)', 'rgba(255,80,0,0)']} style={{ flex: 1 }} />
    </View>
  );
}

function LuminaBg() {
  return (
    <View style={{ position: 'absolute', top: 80, left: SCREEN_W / 2 - 160, width: 320, height: 320, borderRadius: 160, overflow: 'hidden' }}>
      <LinearGradient colors={['rgba(91,63,255,0.06)', 'rgba(91,63,255,0)']} style={{ flex: 1 }} />
    </View>
  );
}

function AmbientBackground({ themeId }: { themeId: ThemeId }) {
  switch (themeId) {
    case 'nebula':     return <NebulaBg />;
    case 'terminal':   return <TerminalBg />;
    case 'glassmorph': return <GlassmorphBg />;
    case 'solaris':    return <SolarisBg />;
    case 'lumina':     return <LuminaBg />;
    default:           return null;
  }
}

// ─── Theme Picker ──────────────────────────────────────────────────────────────

function ThemePicker({ visible, currentTheme, onSelect, onClose }: {
  visible: boolean;
  currentTheme: ThemeId;
  onSelect: (id: ThemeId) => void;
  onClose: () => void;
}) {
  const C = THEMES[currentTheme].colors;
  if (!visible) return null;
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onClose}
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-start', paddingTop: 90, paddingRight: 20, alignItems: 'flex-end',
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {}}
        style={{
          backgroundColor: C.surface1, borderRadius: 16, borderWidth: 1, borderColor: C.border,
          overflow: 'hidden', minWidth: 220,
        }}
      >
        {THEME_LIST.map((t, i) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => { onSelect(t.id); onClose(); }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 14,
              borderBottomWidth: i < THEME_LIST.length - 1 ? 1 : 0,
              borderBottomColor: C.borderDim,
              backgroundColor: currentTheme === t.id ? `${t.previewColor}14` : 'transparent',
            }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.previewColor, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, color: currentTheme === t.id ? t.previewColor : C.textPrimary }}>
                {t.label}
              </Text>
              <Text style={{ fontSize: 9, color: C.textDim, marginTop: 1 }}>{t.description}</Text>
            </View>
            {currentTheme === t.id && <Check size={12} color={t.previewColor} strokeWidth={2.5} />}
          </TouchableOpacity>
        ))}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Orbital Ring System ───────────────────────────────────────────────────────
// Planetary-scale atmospheric rings behind the score - the signature cinematic element.

function OrbitalRingSystem({ C, themeId }: { C: any; themeId: ThemeId }) {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(120);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 28000 }), -1, false);
    rot2.value = withRepeat(withTiming(120 + 360, { duration: 38000 }), -1, false);
    return () => { cancelAnimation(rot1); cancelAnimation(rot2); };
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot1.value}deg` }] }));
  const dot2Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot2.value}deg` }] }));

  const isTerminal = themeId === 'terminal';
  const isLumina   = themeId === 'lumina';

  // Orbital radii - outer ring, inner ring
  const W = SCREEN_W;
  const H = isTerminal ? 200 : 140; // terminal: taller (more circular), others: flatter
  const CX = W / 2;
  const CY = H / 2;
  const rx1 = W * 0.46;
  const ry1 = isTerminal ? rx1 * 0.82 : rx1 * 0.28;
  const rx2 = W * 0.36;
  const ry2 = isTerminal ? rx2 * 0.82 : rx2 * 0.28;
  const dot1R = rx1; // dot orbits at outer ring radius (approximated as circle)
  const dot2R = rx2;

  if (isLumina) {
    return (
      <View style={{ position: 'absolute', width: W, height: 100, alignSelf: 'center' }}>
        <Svg width={W} height={100} style={{ position: 'absolute' }}>
          <Ellipse cx={CX} cy={50} rx={W * 0.40} ry={W * 0.40 * 0.22} fill="none" stroke={C.primary} strokeWidth={0.8} opacity={0.14} />
        </Svg>
      </View>
    );
  }

  return (
    <View style={{ position: 'absolute', width: W, height: H, alignSelf: 'center' }}>
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        {/* Outer orbital ring */}
        <Ellipse
          cx={CX} cy={CY}
          rx={rx1} ry={ry1}
          fill="none"
          stroke={C.primary}
          strokeWidth={isTerminal ? 1 : 0.7}
          opacity={isTerminal ? 0.18 : 0.15}
          strokeDasharray={isTerminal ? '4 8' : undefined}
        />
        {/* Middle orbital ring */}
        <Ellipse
          cx={CX} cy={CY}
          rx={rx2} ry={ry2}
          fill="none"
          stroke={C.primaryGlow}
          strokeWidth={isTerminal ? 1 : 0.6}
          opacity={isTerminal ? 0.22 : 0.20}
        />
        {/* Inner accent ring (very close to score ring) */}
        <Ellipse
          cx={CX} cy={CY}
          rx={W * 0.26}
          ry={isTerminal ? W * 0.26 * 0.82 : W * 0.26 * 0.22}
          fill="none"
          stroke={C.primaryGlow}
          strokeWidth={0.5}
          opacity={0.28}
        />
      </Svg>

      {/* Animated particle on outer ring (rotates as a circle, looks orbital) */}
      <View style={{ position: 'absolute', width: W, height: H, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ width: dot1R * 2, height: dot1R * 2, alignItems: 'center', justifyContent: 'flex-start' }, dot1Style]}>
          <View style={{
            width: 3, height: 3, borderRadius: 1.5,
            backgroundColor: C.primaryGlow,
            shadowColor: C.primaryGlow, shadowOffset: { width: 0, height: 0 },
            shadowRadius: 5, shadowOpacity: 1,
          }} />
        </Animated.View>
      </View>

      {/* Animated particle on middle ring */}
      <View style={{ position: 'absolute', width: W, height: H, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ width: dot2R * 2, height: dot2R * 2, alignItems: 'center', justifyContent: 'flex-start' }, dot2Style]}>
          <View style={{
            width: 2.5, height: 2.5, borderRadius: 1.25,
            backgroundColor: C.accent,
            shadowColor: C.accent, shadowOffset: { width: 0, height: 0 },
            shadowRadius: 4, shadowOpacity: 0.9,
          }} />
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, themeId }: { score: number; themeId: ThemeId }) {
  const C = THEMES[themeId].colors;
  const { privacyMode } = useAppStore();
  const atmosphereLevel = useAppStore((s) => s.atmosphereLevel);
  const { size: RING_SIZE, stroke: RING_STROKE } = RING_CONFIGS[themeId];

  const modeConfigs = buildModeConfigs(C.primary, C.accent);
  const activeMode = modeConfigs.find((m) => m.id === privacyMode) ?? modeConfigs[2];
  const modeGlow = activeMode.color;
  const RING_RADIUS = (RING_SIZE - RING_STROKE * 2) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const strokeDash = CIRCUMFERENCE * (score / 100);
  const strokeGap = CIRCUMFERENCE - strokeDash;

  const orbitAngle = useSharedValue(0);
  const pulse = useSharedValue(0.6);
  const glowId = `glow_${themeId}`;
  const ringId = `ring_${themeId}`;

  useEffect(() => {
    const pd = PULSE_DURATIONS[atmosphereLevel];
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: pd }), withTiming(0.6, { duration: pd })),
      -1, true
    );
  }, [atmosphereLevel]);

  useEffect(() => {
    orbitAngle.value = withRepeat(
      withTiming(360, { duration: ORBIT_DURATIONS[atmosphereLevel] }),
      -1, false
    );
  }, [atmosphereLevel]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitAngle.value}deg` }],
  }));

  const extraGlow = themeId === 'nebula' ? 36 : themeId === 'solaris' ? 28 : 18;
  const SVG_SIZE = RING_SIZE + extraGlow * 2;
  const CENTER = SVG_SIZE / 2;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: SVG_SIZE, height: SVG_SIZE }}>
      <Svg width={SVG_SIZE} height={SVG_SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <SvgRadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={modeGlow} stopOpacity={themeId === 'nebula' ? '0.28' : '0.16'} />
            <Stop offset="55%"  stopColor={modeGlow} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={modeGlow} stopOpacity="0" />
          </SvgRadialGradient>
          <SvgLinearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor={C.primaryGlow} stopOpacity="1" />
            <Stop offset="100%" stopColor={modeGlow}       stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={CENTER} cy={CENTER} r={RING_RADIUS + extraGlow} fill={`url(#${glowId})`} />
        <Circle cx={CENTER} cy={CENTER} r={RING_RADIUS} fill="none" stroke={C.ringTrack} strokeWidth={RING_STROKE} />
        <Circle
          cx={CENTER} cy={CENTER} r={RING_RADIUS}
          fill="none"
          stroke={`url(#${ringId})`}
          strokeWidth={RING_STROKE + (themeId === 'nebula' ? 2 : 1)}
          strokeDasharray={`${strokeDash} ${strokeGap}`}
          strokeDashoffset={CIRCUMFERENCE / 4}
          strokeLinecap="round"
        />
        {themeId === 'terminal' && (
          <Circle
            cx={CENTER} cy={CENTER} r={RING_RADIUS + RING_STROKE + 6}
            fill="none" stroke="#00FF41" strokeWidth={1} opacity={0.22}
            strokeDasharray="3 7"
          />
        )}
      </Svg>

      {/* Orbiting dot */}
      <Animated.View style={[{ position: 'absolute', width: SVG_SIZE, height: SVG_SIZE, alignItems: 'center' }, orbitStyle]}>
        <View style={{
          width: themeId === 'nebula' ? 10 : 7,
          height: themeId === 'nebula' ? 10 : 7,
          borderRadius: 5,
          backgroundColor: modeGlow,
          marginTop: extraGlow + RING_STROKE / 2 - (themeId === 'nebula' ? 5 : 3.5),
          shadowColor: modeGlow,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 10, shadowOpacity: 1,
        }} />
      </Animated.View>

      {/* Center text */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{
          fontSize: 64,
          fontWeight: '900',
          color: C.textPrimary,
          lineHeight: 68,
          letterSpacing: -3,
        }}>
          {score}
        </Text>
        <View style={{
          paddingHorizontal: 14, paddingVertical: 4,
          borderRadius: 20, marginTop: 4,
          backgroundColor: `${C.primary}1A`,
          borderWidth: 1, borderColor: `${C.primary}38`,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.primary, letterSpacing: 2 }}>
            {scoreLabel(score)}
          </Text>
        </View>
        <Text style={{ fontSize: 9, color: C.textDim, marginTop: 6, letterSpacing: 2 }}>
          PRIVACY SCORE
        </Text>
      </View>
    </View>
  );
}

// ─── System Status Bar ─────────────────────────────────────────────────────────

function SystemStatusBar({ C }: { C: any }) {
  const { agents } = useAppStore();
  const activeCount = agents.filter((a) => a.status !== 'idle').length;

  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
      paddingHorizontal: 20, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: C.borderDim,
    }}>
      {/* Left: AI Swarm */}
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 8, color: C.safe, fontWeight: '700', letterSpacing: 1.5 }}>
          AI SWARM ONLINE
        </Text>
        <Text style={{ fontSize: 9, color: C.textDim, letterSpacing: 0.5 }}>
          {activeCount}/{agents.length} NODES ACTIVE
        </Text>
        <View style={{ flexDirection: 'row', gap: 5, marginTop: 3 }}>
          {agents.slice(0, 5).map((a, i) => (
            <View key={i} style={{
              width: 5, height: 5, borderRadius: 2.5,
              backgroundColor: a.status !== 'idle' ? C.safe : C.textDim,
              shadowColor: a.status !== 'idle' ? C.safe : 'transparent',
              shadowOffset: { width: 0, height: 0 }, shadowRadius: 3, shadowOpacity: 0.9,
            }} />
          ))}
        </View>
      </View>

      {/* Right: System Status */}
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ fontSize: 8, color: C.textDim, letterSpacing: 1.5 }}>SYSTEM STATUS</Text>
        <Text style={{ fontSize: 9, color: C.safe, fontWeight: '700', letterSpacing: 1 }}>SECURE</Text>
        <View style={{ marginTop: 3 }}>
          <Shield size={14} color={C.safe} strokeWidth={1.8} />
        </View>
      </View>
    </View>
  );
}

// ─── Privacy Coach Bar ─────────────────────────────────────────────────────────

function PrivacyCoachBar({ C }: { C: any }) {
  const recentEvents = useAppStore((s) => s.recentEvents);
  const latest = recentEvents[0];

  const dotOp = useSharedValue(1);
  useEffect(() => {
    dotOp.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1, true
    );
    return () => cancelAnimation(dotOp);
  }, []);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOp.value }));

  const title = latest?.title ?? 'Privacy Coach: All clear';
  const diff = latest ? Date.now() - latest.timestamp : 0;
  const timeStr = diff < 60000 ? 'just now' : `${Math.floor(diff / 60000)}m ago`;

  return (
    <Animated.View
      key={latest?.id ?? 'empty'}
      entering={FadeIn.duration(300)}
      style={{
        marginHorizontal: 20, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: C.glass1,
        borderWidth: 1, borderColor: C.borderDim,
        borderLeftWidth: 3, borderLeftColor: C.safe,
      }}
    >
      <Animated.View style={[{
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: C.safe,
        shadowColor: C.safe, shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5, shadowOpacity: 1,
      }, dotStyle]} />
      <Text style={{ flex: 1, fontSize: 11, color: C.textSecondary }} numberOfLines={1}>
        {title}
      </Text>
      <Text style={{ fontSize: 9, color: C.textDim }}>{timeStr}</Text>
      <View style={{
        paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 4, backgroundColor: `${C.safe}20`,
        borderWidth: 1, borderColor: `${C.safe}40`,
      }}>
        <Text style={{ fontSize: 7, fontWeight: '800', color: C.safe, letterSpacing: 1.5 }}>LIVE</Text>
      </View>
    </Animated.View>
  );
}

// ─── Threat Counts ─────────────────────────────────────────────────────────────

function ThreatCounts({ themeId }: { themeId: ThemeId }) {
  const C = THEMES[themeId].colors;
  const { threatEvents } = useAppStore();
  const router = useRouter();

  const critical = threatEvents.filter((e) => e.riskLevel === 'critical' && !e.resolved).length;
  const high     = threatEvents.filter((e) => e.riskLevel === 'high'     && !e.resolved).length;
  const medium   = threatEvents.filter((e) => e.riskLevel === 'medium'   && !e.resolved).length;

  const items = [
    { label: 'CRITICAL', count: critical, color: C.threat },
    { label: 'HIGH',     count: high,     color: '#FF7A00' },
    { label: 'MEDIUM',   count: medium,   color: C.accent  },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(150).springify()}
      style={{
        marginHorizontal: 20, borderRadius: 16,
        borderWidth: 1, borderColor: C.borderDim,
        backgroundColor: C.surface1, overflow: 'hidden', marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {items.map((item, i) => (
          <View
            key={item.label}
            style={{
              flex: 1, alignItems: 'center', paddingVertical: 16,
              borderRightWidth: i < items.length - 1 ? 1 : 0,
              borderRightColor: C.borderDim,
            }}
          >
            <Text style={{ fontSize: 34, fontWeight: '900', color: item.color, lineHeight: 38, letterSpacing: -1 }}>
              {item.count}
            </Text>
            <Text style={{ fontSize: 7, color: C.textDim, letterSpacing: 1.8, fontWeight: '600', marginTop: 2 }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/threat-feed')}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 14, paddingVertical: 9, gap: 7,
          borderTopWidth: 1, borderTopColor: C.borderDim,
        }}
      >
        <View style={{
          width: 5, height: 5, borderRadius: 2.5,
          backgroundColor: C.threat,
          shadowColor: C.threat, shadowOffset: { width: 0, height: 0 }, shadowRadius: 4, shadowOpacity: 1,
        }} />
        <Text style={{ fontSize: 9, color: C.textDim, letterSpacing: 1, flex: 1 }}>ACTIVE THREATS</Text>
        <Text style={{ fontSize: 10, color: C.primary, fontWeight: '600', letterSpacing: 0.3 }}>
          View all {critical + high + medium} {'>'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Agent Icon ────────────────────────────────────────────────────────────────

function AgentIcon({ agent, index, C }: { agent: any; index: number; C: any }) {
  const Icon = AGENT_ICONS[agent.iconKey] ?? Shield;
  const isActive = agent.status !== 'idle';
  const displayName = AGENT_DISPLAY[agent.iconKey] ?? agent.name.split(' ')[0].toUpperCase();
  const statusLabel = agent.status === 'idle' ? 'STANDBY' : 'ACTIVE';

  const pulse = useSharedValue(0.6);
  useEffect(() => {
    if (!isActive) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400 + index * 120 }),
        withTiming(0.6, { duration: 1400 + index * 120 })
      ),
      -1, true
    );
    return () => cancelAnimation(pulse);
  }, [isActive]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: isActive ? pulse.value : 0.35,
  }));

  return (
    <View style={{ alignItems: 'center', gap: 5, flex: 1 }}>
      <Animated.View style={pulseStyle}>
        <View style={{
          width: 46, height: 46, borderRadius: 13,
          backgroundColor: `${agent.color}12`,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: isActive ? `${agent.color}50` : C.borderDim,
          shadowColor: isActive ? agent.color : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 8, shadowOpacity: 0.5,
        }}>
          <Icon size={20} color={isActive ? agent.color : C.textDim} strokeWidth={1.8} />
        </View>
      </Animated.View>
      <Text style={{ fontSize: 7, color: isActive ? C.textSecondary : C.textDim, fontWeight: '600', letterSpacing: 0.5 }}>
        {displayName}
      </Text>
      <Text style={{ fontSize: 6, color: isActive ? C.safe : C.textDim, fontWeight: '700', letterSpacing: 1 }}>
        {statusLabel}
      </Text>
    </View>
  );
}

// ─── Agent Row ─────────────────────────────────────────────────────────────────

function AgentRow({ themeId }: { themeId: ThemeId }) {
  const C = THEMES[themeId].colors;
  const { agents } = useAppStore();

  return (
    <Animated.View
      entering={FadeInDown.delay(250).springify()}
      style={{
        marginHorizontal: 20, borderRadius: 16,
        borderWidth: 1, borderColor: C.borderDim,
        backgroundColor: C.surface1, padding: 14, marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 9, color: C.textDim, letterSpacing: 2, fontWeight: '600' }}>AI SWARM</Text>
        <Text style={{ fontSize: 9, color: C.primary, fontWeight: '600' }}>
          {agents.filter((a) => a.status !== 'idle').length}/{agents.length} active
        </Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {agents.slice(0, 5).map((agent, i) => (
          <AgentIcon key={agent.id} agent={agent} index={i} C={C} />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Privacy Mode Panel ────────────────────────────────────────────────────────

function PrivacyModePanel({ themeId }: { themeId: ThemeId }) {
  const C = THEMES[themeId].colors;
  const { privacyMode, setPrivacyMode } = useAppStore();
  const modeConfigs = buildModeConfigs(C.primary, C.accent);
  const activeConfig = modeConfigs.find((m) => m.id === privacyMode) ?? modeConfigs[2];

  return (
    <Animated.View
      entering={FadeInDown.delay(340).springify()}
      style={{
        marginHorizontal: 20, borderRadius: 16,
        borderWidth: 1, borderColor: C.borderDim,
        backgroundColor: C.surface1, padding: 14, marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 9, color: C.textDim, letterSpacing: 2, marginBottom: 12, fontWeight: '600' }}>
        PRIVACY MODE
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {modeConfigs.map((m) => {
          const isActive = privacyMode === m.id;
          const ModeIcon = m.icon;
          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => setPrivacyMode(m.id)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10,
                backgroundColor: isActive ? `${m.color}20` : C.glass1,
                borderWidth: 1, borderColor: isActive ? `${m.color}55` : C.borderDim,
              }}
            >
              <ModeIcon size={11} color={isActive ? m.color : C.textDim} strokeWidth={2} />
              <Text style={{ fontSize: 10, fontWeight: isActive ? '700' : '400', color: isActive ? m.color : C.textDim }}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Animated.View
        key={privacyMode}
        entering={FadeIn.duration(220)}
        style={{
          borderRadius: 16, padding: 13,
          backgroundColor: `${activeConfig.color}0D`,
          borderWidth: 1, borderColor: `${activeConfig.color}2A`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={{
            width: 30, height: 30, borderRadius: 9,
            backgroundColor: `${activeConfig.color}1E`,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: `${activeConfig.color}38`,
          }}>
            <activeConfig.icon size={14} color={activeConfig.color} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: activeConfig.color }}>{activeConfig.label} Mode</Text>
              <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: `${activeConfig.color}20` }}>
                <Text style={{ fontSize: 7, fontWeight: '700', color: activeConfig.color, letterSpacing: 1 }}>ACTIVE</Text>
              </View>
            </View>
            <Text style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{activeConfig.description}</Text>
          </View>
        </View>
        {activeConfig.perks.map((perk, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <ShieldCheck size={10} color={activeConfig.color} strokeWidth={2.5} />
            <Text style={{ fontSize: 10, color: C.textSecondary }}>{perk}</Text>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

// ─── OS Footer ─────────────────────────────────────────────────────────────────

function OSFooter({ C }: { C: any }) {
  const lockOp = useSharedValue(0.6);
  useEffect(() => {
    lockOp.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800 }), withTiming(0.6, { duration: 1800 })),
      -1, true
    );
    return () => cancelAnimation(lockOp);
  }, []);
  const lockStyle = useAnimatedStyle(() => ({ opacity: lockOp.value }));

  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginHorizontal: 20, marginTop: 4, marginBottom: 16,
      paddingTop: 12,
      borderTopWidth: 1, borderTopColor: C.borderDim,
    }}>
      <View>
        <Text style={{ fontSize: 8, color: C.textDim, letterSpacing: 1, fontWeight: '600' }}>
          OMNYX OS V1.0.0
        </Text>
        <Text style={{ fontSize: 7, color: C.textDim, marginTop: 2, letterSpacing: 0.5 }}>
          BUILT FOR PRIVACY, DESIGNED FOR FREEDOM.
        </Text>
      </View>
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5 }, lockStyle]}>
        <Shield size={9} color={C.safe} strokeWidth={2} />
        <View>
          <Text style={{ fontSize: 7, color: C.safe, fontWeight: '700', letterSpacing: 1 }}>
            LOCAL ANALYSIS
          </Text>
          <Text style={{ fontSize: 7, color: C.safe, letterSpacing: 1 }}>NO DATA LEAVES DEVICE</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Standard Layout ───────────────────────────────────────────────────────────

function StandardLayout({
  themeId,
  score,
  trend,
  ptsChange,
  onThemePick,
}: {
  themeId: ThemeId;
  score: number;
  trend: string;
  ptsChange: number;
  onThemePick: () => void;
}) {
  const theme = THEMES[themeId];
  const C = theme.colors;

  const trendColor = trend === 'improving' ? C.safe : trend === 'declining' ? C.threat : C.textDim;

  // Orbital ring height offset so it sits centered behind the score ring
  const orbH = themeId === 'terminal' ? 200 : 140;

  return (
    <>
      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6,
      }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: C.textPrimary, letterSpacing: 3 }}>OMNYX</Text>
          <Text style={{ fontSize: 8, color: C.textDim, letterSpacing: 2 }}>AI PRIVACY INTELLIGENCE</Text>
        </View>
        <TouchableOpacity
          onPress={onThemePick}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 12, paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: `${C.primary}12`,
            borderWidth: 1, borderColor: `${C.primary}35`,
          }}
        >
          <View style={{
            width: 5, height: 5, borderRadius: 2.5,
            backgroundColor: C.primary,
            shadowColor: C.primary, shadowOffset: { width: 0, height: 0 }, shadowRadius: 3, shadowOpacity: 1,
          }} />
          <Text style={{ fontSize: 10, color: C.primary, fontWeight: '700', letterSpacing: 1.2 }}>
            {theme.label}
          </Text>
          <ChevronDown size={11} color={C.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ── System Status Bar ── */}
      <SystemStatusBar C={C} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ── Orbital Hero ── */}
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 16 }}>
          {/* Clipped container - prevents orbital ring SVG from bleeding off-screen */}
          <View style={{ width: SCREEN_W, alignItems: 'center', overflow: 'hidden' }}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {/* Orbital rings sit behind the score ring */}
              <View style={{
                position: 'absolute',
                width: SCREEN_W,
                height: orbH,
                marginTop: 0,
              }}>
                <OrbitalRingSystem C={C} themeId={themeId} />
              </View>

              {/* Score ring - centered */}
              <Animated.View entering={FadeIn.delay(60)}>
                <ScoreRing score={score} themeId={themeId} />
              </Animated.View>
            </View>
          </View>

          {/* Score delta */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: C.textDim, letterSpacing: 0.3 }}>
              {ptsChange} pts from last scan
            </Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${trendColor}18` }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: trendColor, letterSpacing: 1.2 }}>
                {trend.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Privacy Coach ── */}
        <PrivacyCoachBar C={C} />

        {/* ── Threat Counts ── */}
        <ThreatCounts themeId={themeId} />

        {/* ── Agent Row ── */}
        <AgentRow themeId={themeId} />

        {/* ── Privacy Mode ── */}
        <PrivacyModePanel themeId={themeId} />

        {/* ── OS Footer ── */}
        <OSFooter C={C} />
      </ScrollView>
    </>
  );
}

// ─── Lumina Layout ─────────────────────────────────────────────────────────────

function LuminaLayout({ score, onThemePick }: { score: number; onThemePick: () => void }) {
  const C = THEMES.lumina.colors;

  return (
    <>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6,
      }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: C.textPrimary, letterSpacing: 3 }}>OMNYX</Text>
          <Text style={{ fontSize: 8, color: C.textDim, letterSpacing: 2 }}>AI PRIVACY INTELLIGENCE</Text>
        </View>
        <TouchableOpacity
          onPress={onThemePick}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
            backgroundColor: `${C.primary}10`, borderWidth: 1, borderColor: `${C.primary}28`,
          }}
        >
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.primary }} />
          <Text style={{ fontSize: 10, color: C.primary, fontWeight: '700', letterSpacing: 1.2 }}>LUMINA</Text>
          <ChevronDown size={11} color={C.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <SystemStatusBar C={C} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 16 }}>
          <View style={{ width: SCREEN_W, alignItems: 'center', overflow: 'hidden' }}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: SCREEN_W, height: 100 }}>
                <OrbitalRingSystem C={C} themeId="lumina" />
              </View>
              <Animated.View entering={FadeIn.delay(60)}>
                <ScoreRing score={score} themeId="lumina" />
              </Animated.View>
            </View>
          </View>
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 10, color: C.textDim, textAlign: 'center' }}>AI-NATIVE PRIVACY OS</Text>
          </View>
        </View>

        <PrivacyCoachBar C={C} />
        <ThreatCounts themeId="lumina" />
        <AgentRow themeId="lumina" />
        <PrivacyModePanel themeId="lumina" />
        <OSFooter C={C} />
      </ScrollView>
    </>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { privacyScore, currentTheme, setTheme } = useAppStore();
  const atmosphereLevel = useAppStore((s) => s.atmosphereLevel);
  const [pickerVisible, setPickerVisible] = useState(false);
  const C = THEMES[currentTheme].colors;
  const ptsChange = Math.abs(privacyScore.current - privacyScore.previous);

  const shiftScale = useSharedValue(0.1);
  const shiftOpacity = useSharedValue(0);
  const prevLevel = useRef(atmosphereLevel);

  useEffect(() => {
    if (prevLevel.current !== 'critical' && atmosphereLevel === 'critical') {
      shiftScale.value = 0.1;
      shiftOpacity.value = 0;
      shiftScale.value = withTiming(3.5, { duration: 1400 });
      shiftOpacity.value = withSequence(
        withTiming(0.20, { duration: 120 }),
        withTiming(0, { duration: 1280 })
      );
    }
    prevLevel.current = atmosphereLevel;
  }, [atmosphereLevel]);

  const trend =
    privacyScore.current > privacyScore.previous ? 'improving'
    : privacyScore.current < privacyScore.previous ? 'declining'
    : 'stable';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AmbientBackground themeId={currentTheme} />
      <LinearGradient
        colors={C.gradientTop}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />
      <AtmosphereShiftOverlay scale={shiftScale} opacity={shiftOpacity} color={C.threat} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {currentTheme === 'lumina' ? (
          <LuminaLayout
            score={privacyScore.current}
            onThemePick={() => setPickerVisible(true)}
          />
        ) : (
          <StandardLayout
            themeId={currentTheme}
            score={privacyScore.current}
            trend={trend}
            ptsChange={ptsChange}
            onThemePick={() => setPickerVisible(true)}
          />
        )}
      </SafeAreaView>

      <ThemePicker
        visible={pickerVisible}
        currentTheme={currentTheme}
        onSelect={(id) => setTheme(id)}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
