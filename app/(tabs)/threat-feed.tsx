import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Copy, Check } from 'lucide-react-native';
import * as ExpoClipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  FadeInDown,
} from 'react-native-reanimated';
import { useAppStore as useStore } from '@store/useAppStore';
import {
  AlertTriangle,
  Mic,
  Clipboard,
  Globe,
  MapPin,
  Camera,
  Activity,
  Shield,
  ShieldCheck,
} from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';

import { THEMES } from '@/theme';
import { useAppStore } from '@store/useAppStore';
import type { ThreatEvent, RiskLevel, ThreatEventType } from '@/types';
import { AIInsightPanel } from '@/components/AIInsightPanel';

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

const EVENT_LABELS: Record<ThreatEventType, string> = {
  microphone_access: 'Microphone Access',
  camera_access: 'Camera Access',
  clipboard_read: 'Clipboard Read',
  location_access: 'Location Access',
  network_request: 'Network Request',
  tracker_detected: 'Tracker Detected',
  suspicious_permission: 'Suspicious Permission',
  background_activity: 'Background Activity',
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function LiveIndicator({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 700 }),
        withTiming(1, { duration: 700 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 5,
          shadowOpacity: 1,
        },
        style,
      ]}
    />
  );
}

function ThreatCard({
  event,
  index,
  themeId,
}: {
  event: ThreatEvent;
  index: number;
  themeId: string;
}) {
  const theme = THEMES[themeId as keyof typeof THEMES];
  const C = theme.colors;
  const { resolveThreat } = useAppStore();
  const Icon = EVENT_ICONS[event.eventType] ?? AlertTriangle;

  const riskColorMap: Record<RiskLevel, string> = {
    critical: C.threat,
    high: '#FF7A00',
    medium: C.accent,
    low: C.textSecondary,
    safe: C.safe,
  };
  const riskColor = riskColorMap[event.riskLevel];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: event.resolved ? C.borderDim : `${riskColor}28`,
        opacity: event.resolved ? 0.5 : 1,
        backgroundColor: C.surface1,
      }}
    >
      {!event.resolved && (
        <View style={{ height: 2, backgroundColor: riskColor, width: '100%' }} />
      )}

      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${riskColor}14`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 13,
              borderWidth: 1,
              borderColor: `${riskColor}25`,
            }}
          >
            <Icon size={18} color={riskColor} strokeWidth={2} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>
              {event.appName}
            </Text>
            <Text style={{ fontSize: 10, color: C.textDim, marginTop: 2, letterSpacing: 0.3 }}>
              {EVENT_LABELS[event.eventType]} · {timeAgo(event.timestamp)}
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: `${riskColor}18`,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: '700', color: riskColor, letterSpacing: 1 }}>
              {event.riskLevel.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, color: C.textSecondary, lineHeight: 19, marginBottom: 12 }}>
          {event.description}
        </Text>

        {event.aiExplanation && (
          <View
            style={{
              backgroundColor: `${C.primary}0A`,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: `${C.primary}20`,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                letterSpacing: 2,
                color: C.primary,
                fontWeight: '700',
                marginBottom: 7,
              }}
            >
              AI ANALYSIS
            </Text>
            <Text style={{ fontSize: 12, color: C.textSecondary, lineHeight: 18 }}>
              {event.aiExplanation}
            </Text>
          </View>
        )}

        <View style={{ marginBottom: 12 }}>
          <AIInsightPanel threat={event} C={C} />
        </View>

        {!event.resolved ? (
          <TouchableOpacity
            onPress={() => resolveThreat(event.id)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-end',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: `${C.primary}12`,
              borderWidth: 1,
              borderColor: `${C.primary}30`,
            }}
          >
            <Shield size={12} color={C.primary} />
            <Text style={{ fontSize: 11, color: C.primary, fontWeight: '600' }}>
              Mark Resolved
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              alignSelf: 'flex-end',
            }}
          >
            <ShieldCheck size={12} color={C.safe} />
            <Text style={{ fontSize: 11, color: C.safe }}>Resolved</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Tension Meter ─────────────────────────────────────────────────────────────

function TensionMeter({ activeCount, C }: { activeCount: number; C: any }) {
  const atmosphereLevel = useStore((s) => s.atmosphereLevel);
  const LEVEL_COLOR: Record<string, string> = {
    calm: C.safe, elevated: C.warning, tense: '#FF7A00', critical: C.threat,
  };
  const lc = LEVEL_COLOR[atmosphereLevel] ?? C.textDim;

  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: atmosphereLevel === 'critical' ? 400 : 900 }),
        withTiming(0.5, { duration: atmosphereLevel === 'critical' ? 400 : 900 })
      ),
      -1, true
    );
    return () => cancelAnimation(pulse);
  }, [atmosphereLevel]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    shadowOpacity: pulse.value,
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <Animated.View style={[{
        width: 7, height: 7, borderRadius: 3.5, backgroundColor: lc,
        shadowColor: lc, shadowOffset: { width: 0, height: 0 }, shadowRadius: 6,
      }, dotStyle]} />
      <Text style={{ fontSize: 10, color: lc, fontWeight: '700', letterSpacing: 1 }}>
        {atmosphereLevel.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 10, color: C.textDim }}>
        · {activeCount} active
      </Text>
    </View>
  );
}

// ─── Threat Pulse Wrapper (critical breathing border) ─────────────────────────

function ThreatPulseWrapper({
  children, isCritical, riskColor,
}: { children: React.ReactNode; isCritical: boolean; riskColor: string }) {
  const glowOp = useSharedValue(isCritical ? 0.25 : 0);

  useEffect(() => {
    if (isCritical) {
      glowOp.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1100 }),
          withTiming(0.2, { duration: 1100 })
        ),
        -1, true
      );
    } else {
      glowOp.value = 0;
    }
    return () => cancelAnimation(glowOp);
  }, [isCritical]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
      {isCritical && (
        <Animated.View style={[{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: 16, borderWidth: 1.5, borderColor: riskColor,
          shadowColor: riskColor, shadowOffset: { width: 0, height: 0 },
          shadowRadius: 14, shadowOpacity: 1,
        }, glowStyle]} />
      )}
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ hasScanned, C }: { hasScanned: boolean; C: any }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 }}>
      <ShieldCheck size={44} color={C.safe} strokeWidth={1.2} style={{ marginBottom: 16, opacity: 0.7 }} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 8 }}>
        {hasScanned ? 'No threats detected' : 'No scan data yet'}
      </Text>
      <Text style={{ fontSize: 12, color: C.textDim, textAlign: 'center', lineHeight: 18 }}>
        {hasScanned
          ? 'Last scan found no suspicious permission profiles or tracker patterns.'
          : 'Run a device scan from the Intelligence tab to detect permission risks and tracker activity.'}
      </Text>
    </View>
  );
}

type FilterId = RiskLevel | 'all';

export default function ThreatFeedScreen() {
  const { threatEvents, clearUnreadThreats, currentTheme, scanResult, resolveAllThreats } = useAppStore();
  const [filter, setFilter] = useState<FilterId>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const theme = THEMES[currentTheme];
  const C = theme.colors;

  useEffect(() => {
    clearUnreadThreats();
  }, []);

  const filtered =
    filter === 'all' ? threatEvents : threatEvents.filter((e) => e.riskLevel === filter);

  const activeCount = threatEvents.filter((e) => !e.resolved).length;

  const FILTERS: { id: FilterId; label: string; color: string }[] = [
    { id: 'all', label: 'All', color: C.textSecondary },
    { id: 'critical', label: 'Critical', color: C.threat },
    { id: 'high', label: 'High', color: '#FF7A00' },
    { id: 'medium', label: 'Medium', color: C.accent },
  ];
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopyThreat = async (threat: ThreatEvent) => {
    const text = `[${threat.riskLevel.toUpperCase()}] ${threat.title} — ${threat.description}`;

    await ExpoClipboard.setStringAsync(text);

    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }

    setCopiedId(threat.id);

    copyTimerRef.current = setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={[`${C.threat}0A`, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: C.textPrimary,
                letterSpacing: 2,
              }}
            >
              THREATS
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                backgroundColor: `${C.threat}12`,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: `${C.threat}35`,
              }}
            >
              <LiveIndicator color={C.threat} />
              <Text style={{ fontSize: 10, color: C.threat, fontWeight: '700', letterSpacing: 1.5 }}>
                LIVE
              </Text>
            </View>
          </View>

          <TensionMeter activeCount={activeCount} C={C} />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FILTERS.map((f) => {
              const count =
                f.id === 'all'
                  ? threatEvents.length
                  : threatEvents.filter((e) => e.riskLevel === f.id).length;
              const isActive = filter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFilter(f.id)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: isActive ? `${f.color}18` : C.glass1,
                    borderWidth: 1,
                    borderColor: isActive ? `${f.color}55` : C.borderDim,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: isActive ? f.color : C.textDim,
                      fontWeight: isActive ? '700' : '400',
                      letterSpacing: 0.5,
                    }}
                  >
                    {f.label} {count > 0 ? `${count}` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {!filtered.every(event => event.resolved) && <TouchableOpacity
          onPress={resolveAllThreats}
          activeOpacity={0.7}
          disabled={filtered.every((event) => event.resolved === true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: 24,
            marginBottom: 8,
            gap: 6,
            alignSelf: 'flex-end',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: `${C.primary}12`,
            borderWidth: 1,
            borderColor: `${C.primary}30`,
          }}
        >
          <Shield size={12} color={C.primary} />
          <Text style={{ fontSize: 11, color: C.primary, fontWeight: '600' }}>
            Mark All Resolved
          </Text>
        </TouchableOpacity>}
       
        {filtered.length === 0 ? (
          <EmptyState hasScanned={scanResult !== null} C={C} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const isCritical = !item.resolved && item.riskLevel === 'critical';
              return (
                <ThreatPulseWrapper isCritical={isCritical} riskColor={C.threat}>
                  <View style={{ position: 'relative' }}>
                    <ThreatCard event={item} index={index} themeId={currentTheme} />

                    <TouchableOpacity
                      onPress={() => handleCopyThreat(item)}
                      activeOpacity={0.7}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: C.glass1,
                        borderWidth: 1,
                        borderColor: C.borderDim,
                      }}
                    >
                      {copiedId === item.id ? (
                        <Check size={16} color={C.threat} />
                      ) : (
                        <Copy size={16} color={C.textDim} />
                      )}
                    </TouchableOpacity>
                  </View>
                </ThreatPulseWrapper>
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110, paddingTop: 2 }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
