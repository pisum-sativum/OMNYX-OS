import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  FadeIn,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import {
  TrendingUp,
  TrendingDown,
  Cpu,
  Scan,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Zap,
  CheckCircle2,
  RefreshCw,
  Radio,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { THEMES } from '@/theme';
import { useAppStore } from '@store/useAppStore';
import { usePermissionScan } from '@/hooks/usePermissionScan';
import type { AppRiskProfile, RiskTier } from '@/types/permissions';

const { width: SCREEN_W } = Dimensions.get('window');

const RISK_COLORS: Record<RiskTier, string> = {
  safe: '#22C55E',
  low: '#3B82F6',
  medium: '#F59E0B',
  high: '#FF7A00',
  critical: '#FF3B5C',
};

const RISK_LABELS: Record<RiskTier, string> = {
  safe: 'SAFE',
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  critical: 'CRITICAL',
};

// ── Bar Item (extracted - no hooks in map) ─────────────────────────────────────

function BarItem({
  value,
  max,
  isLatest,
  color,
  day,
  dimColor,
  index,
}: {
  value: number;
  max: number;
  isLatest: boolean;
  color: string;
  day: string;
  dimColor: string;
  index: number;
}) {
  const barH = Math.round((value / max) * 72);
  const animH = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      animH.value = withSpring(barH, { damping: 16, stiffness: 55 });
    }, index * 45);
    return () => clearTimeout(t);
  }, [barH]);

  const barStyle = useAnimatedStyle(() => ({ height: animH.value }));

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
        <Animated.View
          style={[{
            width: '100%',
            borderRadius: 6,
            backgroundColor: isLatest ? color : `${color}55`,
            shadowColor: isLatest ? color : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 6,
            shadowOpacity: 0.7,
          }, barStyle]}
        />
      </View>
      <Text style={{ fontSize: 8, color: isLatest ? color : dimColor }}>{day}</Text>
    </View>
  );
}

// ── Scan button + progress ─────────────────────────────────────────────────────

function ScanPulse({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.6, { duration: 850 }), withTiming(1, { duration: 0 })),
      -1, false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 850 }), withTiming(0.6, { duration: 0 })),
      -1, false
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{
        position: 'absolute',
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: color,
      }, pulseStyle]} />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
    </View>
  );
}

function ScanProgressBar({ C }: { C: any }) {
  const scanProgress = useAppStore((s) => s.scanProgress);
  const scanPhase = useAppStore((s) => s.scanPhase);
  const widthPct = useSharedValue(0);

  useEffect(() => {
    widthPct.value = withSpring(scanProgress, { damping: 20, stiffness: 50 });
  }, [scanProgress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthPct.value}%`,
  }));

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ScanPulse color={C.primary} />
        <Text style={{
          fontSize: 9, fontWeight: '700', color: C.primary,
          letterSpacing: 1.5, flex: 1,
        }}>
          {scanPhase}
        </Text>
        <Text style={{ fontSize: 9, color: C.textDim }}>{scanProgress}%</Text>
      </View>
      <View style={{ height: 3, backgroundColor: C.glass2, borderRadius: 2, overflow: 'hidden' }}>
        <Animated.View style={[{
          height: 3, borderRadius: 2,
          backgroundColor: C.primary,
          shadowColor: C.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 6, shadowOpacity: 0.8,
        }, barStyle]} />
      </View>
    </View>
  );
}

function ScanPanel({ themeId }: { themeId: string }) {
  const theme = THEMES[themeId as keyof typeof THEMES];
  const C = theme.colors;
  const { startScan, isScanning, isNativeAvailable } = usePermissionScan();
  const scanResult = useAppStore((s) => s.scanResult);

  if (isScanning) {
    return (
      <View
        style={{
          marginHorizontal: 20, marginBottom: 12,
          borderRadius: 16, borderWidth: 1, borderColor: `${C.primary}35`,
          backgroundColor: C.surface1, padding: 20,
        }}
      >
        <Text style={{
          fontSize: 9, color: C.primary, letterSpacing: 2,
          fontWeight: '700', marginBottom: 16,
        }}>
          PERMISSION SCAN ACTIVE
        </Text>
        <ScanProgressBar C={C} />
        <Text style={{ fontSize: 10, color: C.textDim, marginTop: 14, lineHeight: 15 }}>
          Analyzing permission profiles across installed applications.
          All processing occurs locally on your device.
        </Text>
      </View>
    );
  }

  if (scanResult) {
    const elapsed = Math.round((Date.now() - scanResult.scannedAt.getTime()) / 1000);
    const timeLabel = elapsed < 60 ? `${elapsed}s ago` : `${Math.floor(elapsed / 60)}m ago`;
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          marginHorizontal: 20, marginBottom: 12,
          borderRadius: 16, borderWidth: 1, borderColor: C.borderDim,
          backgroundColor: C.surface1, overflow: 'hidden',
        }}
      >
        <View style={{ height: 2, backgroundColor: C.safe }} />
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: `${C.safe}14`,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: `${C.safe}28`,
          }}>
            <CheckCircle2 size={17} color={C.safe} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.textPrimary }}>
              Scan Complete
            </Text>
            <Text style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>
              {scanResult.appCount} apps analyzed · {timeLabel}
              {!scanResult.isNativeScan ? ' · Demo data' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={startScan}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
              backgroundColor: `${C.primary}12`,
              borderWidth: 1, borderColor: `${C.primary}30`,
            }}
          >
            <RefreshCw size={11} color={C.primary} strokeWidth={2.5} />
            <Text style={{ fontSize: 10, color: C.primary, fontWeight: '600' }}>Rescan</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(80).springify()}
      style={{
        marginHorizontal: 20, marginBottom: 12,
        borderRadius: 16, borderWidth: 1,
        borderColor: `${C.primary}30`,
        backgroundColor: C.surface1, overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={[`${C.primary}12`, 'transparent'] as const}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80 }}
      />
      <TouchableOpacity onPress={startScan} activeOpacity={0.8} style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: `${C.primary}18`,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: `${C.primary}40`,
          }}>
            <Scan size={22} color={C.primary} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: C.textPrimary, letterSpacing: 0.5 }}>
              SCAN DEVICE
            </Text>
            <Text style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>
              {isNativeAvailable ? 'Real-time permission intelligence' : 'Permission intelligence analysis'}
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
            backgroundColor: C.primary,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 }}>
              RUN
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 11, color: C.textDim, lineHeight: 17 }}>
          Analyzes all installed applications for dangerous permission combinations,
          surveillance capability, and financial exposure patterns.
          Processing is fully local. No data leaves your device.
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Scan summary counts ────────────────────────────────────────────────────────

function ScanSummary({ themeId }: { themeId: string }) {
  const theme = THEMES[themeId as keyof typeof THEMES];
  const C = theme.colors;
  const scanResult = useAppStore((s) => s.scanResult);
  if (!scanResult) return null;

  const items = [
    { label: 'CRITICAL', count: scanResult.criticalCount, color: RISK_COLORS.critical },
    { label: 'HIGH', count: scanResult.highRiskCount, color: RISK_COLORS.high },
    { label: 'MEDIUM', count: scanResult.mediumRiskCount, color: RISK_COLORS.medium },
    { label: 'SAFE', count: scanResult.safeCount, color: RISK_COLORS.safe },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(120).springify()}
      style={{
        marginHorizontal: 20, marginBottom: 12,
        borderRadius: 16, borderWidth: 1, borderColor: C.borderDim,
        backgroundColor: C.surface1, overflow: 'hidden',
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
            <Text style={{ fontSize: 26, fontWeight: '900', color: item.color, lineHeight: 30 }}>
              {item.count}
            </Text>
            <Text style={{ fontSize: 7, color: C.textDim, letterSpacing: 1.5, marginTop: 3, fontWeight: '600' }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={{
        paddingHorizontal: 14, paddingVertical: 8, gap: 5,
        borderTopWidth: 1, borderTopColor: C.borderDim,
        flexDirection: 'row', alignItems: 'center',
      }}>
        <Cpu size={10} color={C.textDim} strokeWidth={2} />
        <Text style={{ fontSize: 9, color: C.textDim, letterSpacing: 0.5 }}>
          {scanResult.appCount} apps analyzed
        </Text>
        <Text style={{ fontSize: 9, color: C.textDim, marginLeft: 'auto' }}>
          Privacy impact: {scanResult.overallPrivacyImpact}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── App risk card (extracted - no hooks in map) ────────────────────────────────

function AppRiskCard({
  profile,
  index,
  C,
}: {
  profile: AppRiskProfile;
  index: number;
  C: any;
}) {
  const [expandedPermission, setExpandedPermission] = useState<string | null>(null);
  const riskColor = RISK_COLORS[profile.riskTier];
  const topPattern = profile.threatPatterns[0];
  const topFactor = profile.suspicionFactors[0];
  const flaggedPermissions = profile.permissions
    .filter((p) => p.isGranted && p.isDangerous)
    .sort((a, b) => b.riskWeight - a.riskWeight)
    .slice(0, 4);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 55).springify()}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: `${C.borderDim}80`,
        gap: 12,
      }}
    >
      {/* Rank */}
      <Text style={{ fontSize: 11, color: C.textDim, width: 18, fontWeight: '700', textAlign: 'right' }}>
        {index + 1}
      </Text>

      {/* Icon */}
      <View style={{
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: `${riskColor}14`,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: `${riskColor}28`,
      }}>
        <ShieldAlert size={15} color={riskColor} strokeWidth={2} />
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: C.textPrimary }}>
          {profile.appName}
        </Text>
        {topPattern ? (
          <View style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
            backgroundColor: `${riskColor}18`,
          }}>
            <Text style={{ fontSize: 8, fontWeight: '700', color: riskColor, letterSpacing: 0.8 }}>
              {topPattern.label.toUpperCase()}
            </Text>
          </View>
        ) : topFactor ? (
          <Text style={{ fontSize: 9, color: C.textDim, lineHeight: 13 }} numberOfLines={1}>
            {topFactor.description}
          </Text>
        ) : (
          <Text style={{ fontSize: 9, color: C.textDim }}>
            {profile.permissions.length} permissions
          </Text>
        )}
        {flaggedPermissions.length > 0 ? (
          <View style={{ marginTop: 4, gap: 3 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {flaggedPermissions.map((perm) => {
                const isOpen = expandedPermission === perm.shortName;
                return (
                  <TouchableOpacity
                    key={perm.shortName}
                    accessibilityRole="button"
                    accessibilityLabel={`${perm.shortName} permission`}
                    accessibilityHint={perm.threat}
                    accessibilityState={{ expanded: isOpen }}
                    onPress={() =>
                      setExpandedPermission(isOpen ? null : perm.shortName)
                    }
                    activeOpacity={0.75}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      minHeight: 36,
                      justifyContent: 'center',
                      borderRadius: 5,
                      backgroundColor: isOpen ? `${riskColor}28` : `${C.borderDim}80`,
                      borderWidth: 1,
                      borderColor: isOpen ? `${riskColor}55` : `${C.borderDim}`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: '700',
                        color: isOpen ? riskColor : C.textDim,
                        letterSpacing: 0.4,
                      }}
                    >
                      {perm.shortName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {expandedPermission ? (
              <Text style={{ fontSize: 11, color: C.textPrimary, lineHeight: 13 }}>
                {
                  flaggedPermissions.find((p) => p.shortName === expandedPermission)
                    ?.threat
                }
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Score */}
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: riskColor, lineHeight: 20 }}>
          {profile.riskScore}
        </Text>
        <View style={{
          paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5,
          backgroundColor: `${riskColor}18`,
        }}>
          <Text style={{ fontSize: 7, fontWeight: '700', color: riskColor, letterSpacing: 1 }}>
            {RISK_LABELS[profile.riskTier]}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function RiskAppList({ themeId }: { themeId: string }) {
  const theme = THEMES[themeId as keyof typeof THEMES];
  const C = theme.colors;
  const scanResult = useAppStore((s) => s.scanResult);

  const topApps = scanResult
    ? scanResult.profiles.slice(0, 8)
    : [];

  if (topApps.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(200).springify()}
      style={{
        marginHorizontal: 20, borderRadius: 16,
        borderWidth: 1, borderColor: C.borderDim,
        backgroundColor: C.surface1, padding: 16, marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.textPrimary }}>Risk Ranking</Text>
          <Text style={{ fontSize: 9, color: C.textDim, marginTop: 2, letterSpacing: 1 }}>
            PERMISSION THREAT INDEX
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <ShieldCheck size={11} color={C.primary} strokeWidth={2.5} />
          <Text style={{ fontSize: 9, color: C.primary, fontWeight: '600' }}>
            {topApps.length} apps
          </Text>
        </View>
      </View>

      {topApps.map((profile, i) => (
        <AppRiskCard
          key={profile.id}
          profile={profile}
          index={i}
          C={C}
        />
      ))}
    </Animated.View>
  );
}

// ── 7-day privacy chart ────────────────────────────────────────────────────────

function PrivacyChart({ themeId }: { themeId: string }) {
  const theme = THEMES[themeId as keyof typeof THEMES];
  const C = theme.colors;
  const privacyScore = useAppStore((s) => s.privacyScore);
  const scanResult = useAppStore((s) => s.scanResult);

  const containerStyle = {
    marginHorizontal: 20, borderRadius: 16, borderWidth: 1,
    borderColor: C.borderDim, backgroundColor: C.surface1,
    padding: 16, marginBottom: 12,
  };

  if (!scanResult) {
    return (
      <Animated.View entering={FadeInDown.delay(300).springify()} style={[containerStyle, { alignItems: 'center', paddingVertical: 24 }]}>
        <TrendingUp size={22} color={C.textDim} strokeWidth={1.5} style={{ marginBottom: 10, opacity: 0.4 }} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.textPrimary, marginBottom: 6 }}>Score Breakdown</Text>
        <Text style={{ fontSize: 11, color: C.textDim, textAlign: 'center', lineHeight: 16 }}>
          Run a device scan to see your privacy score breakdown by category.
        </Text>
      </Animated.View>
    );
  }

  const labels = ['PERM', 'TRKR', 'NET', 'DATA'];
  const values = [
    privacyScore.breakdown.permissions,
    privacyScore.breakdown.trackers,
    privacyScore.breakdown.networkActivity,
    privacyScore.breakdown.dataCollection,
  ];
  const max = Math.max(...values, 1);
  const delta = privacyScore.current - privacyScore.previous;
  const trendColor = delta >= 0 ? C.safe : C.threat;
  const TrendIcon = delta >= 0 ? TrendingUp : TrendingDown;

  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={containerStyle}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.textPrimary }}>Score Breakdown</Text>
          <Text style={{ fontSize: 9, color: C.textDim, marginTop: 2, letterSpacing: 1 }}>CATEGORY ANALYSIS</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <TrendIcon size={12} color={trendColor} strokeWidth={2.5} />
          <Text style={{ fontSize: 11, color: trendColor, fontWeight: '700' }}>
            {delta >= 0 ? '+' : ''}{delta} pts
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {values.map((v, i) => (
          <BarItem
            key={labels[i]}
            value={v}
            max={max}
            isLatest={i === values.length - 1}
            color={C.primary}
            day={labels[i]}
            dimColor={C.textDim}
            index={i}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ── Quick actions ──────────────────────────────────────────────────────────────

function QuickActions({ themeId }: { themeId: string }) {
  const theme = THEMES[themeId as keyof typeof THEMES];
  const C = theme.colors;
  const router = useRouter();
  const { startScan, isScanning } = usePermissionScan();

  const actions = [
    { label: 'Rescan', icon: RefreshCw, color: C.primary, desc: 'Permission scan', onPress: startScan, disabled: isScanning },
    { label: 'Threats', icon: ShieldAlert, color: C.threat, desc: 'Threat feed', onPress: () => router.push('/(tabs)/threat-feed') },
    { label: 'AI Swarm', icon: Cpu, color: C.accent, desc: 'Agent console', onPress: () => router.push('/(tabs)/agents') },
    { label: 'Memory', icon: Radio, color: '#FF8C00', desc: 'Signal archive', onPress: () => router.push('/(tabs)/replay') },
    { label: 'Modes', icon: Lock, color: C.safe, desc: 'Privacy modes', onPress: () => router.push('/(tabs)/modes') },
    { label: 'Settings', icon: Zap, color: '#BF00FF', desc: 'App settings', onPress: () => router.push('/(tabs)/settings') },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(380).springify()}
      style={{
        marginHorizontal: 20, borderRadius: 16, borderWidth: 1,
        borderColor: C.borderDim, backgroundColor: C.surface1,
        padding: 16, marginBottom: 12,
      }}
    >
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.textPrimary }}>Quick Actions</Text>
        <Text style={{ fontSize: 9, color: C.textDim, marginTop: 2, letterSpacing: 1 }}>INTELLIGENCE TOOLS</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={action.label}
              onPress={action.onPress}
              disabled={action.disabled}
              activeOpacity={0.7}
              style={{
                width: (SCREEN_W - 72) / 3,
                paddingVertical: 14, borderRadius: 16,
                alignItems: 'center',
                backgroundColor: `${action.color}0E`,
                borderWidth: 1, borderColor: `${action.color}28`, gap: 6,
                opacity: action.disabled ? 0.5 : 1,
              }}
            >
              <View style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: `${action.color}18`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color={action.color} strokeWidth={1.8} />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '600', color: C.textPrimary }}>{action.label}</Text>
              <Text style={{ fontSize: 8, color: C.textDim }}>{action.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ── System status ──────────────────────────────────────────────────────────────

function SystemStatus({ themeId }: { themeId: string }) {
  const theme = THEMES[themeId as keyof typeof THEMES];
  const C = theme.colors;
  const pulseVal = useSharedValue(0.5);
  const scanResult = useAppStore((s) => s.scanResult);
  const isScanning = useAppStore((s) => s.isScanning);
  const { isNativeAvailable } = usePermissionScan();

  useEffect(() => {
    pulseVal.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400 }),
        withTiming(0.5, { duration: 1400 })
      ),
      -1, true
    );
    return () => cancelAnimation(pulseVal);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseVal.value }));

  const scannerLabel = isScanning ? 'Scanning...' : isNativeAvailable ? 'Native · Ready' : 'Simulation · Ready';
  const statuses = [
    { label: 'Permission Rules', value: '38 patterns', ok: true },
    { label: 'Tracker Database', value: '10 signatures', ok: true },
    { label: 'Scan Engine', value: scannerLabel, ok: true },
    { label: 'Package Monitor', value: 'Active', ok: true },
    { label: 'Apps Scanned', value: scanResult ? `${scanResult.appCount}` : 'Not yet run', ok: !!scanResult },
    { label: 'Last Scan', value: scanResult ? `${Math.round((Date.now() - scanResult.scannedAt.getTime()) / 1000)}s ago` : 'Never', ok: !!scanResult },
  ];

  return (
    <View
      style={{
        marginHorizontal: 20, borderRadius: 16, borderWidth: 1,
        borderColor: C.borderDim, backgroundColor: C.surface1,
        padding: 16, marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.textPrimary }}>System Status</Text>
          <Text style={{ fontSize: 9, color: C.textDim, marginTop: 2, letterSpacing: 1 }}>DIAGNOSTICS</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Animated.View style={[{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: C.safe,
            shadowColor: C.safe,
            shadowOffset: { width: 0, height: 0 }, shadowRadius: 4, shadowOpacity: 1,
          }, pulseStyle]} />
          <Text style={{ fontSize: 9, color: C.safe, fontWeight: '700', letterSpacing: 1 }}>ALL SYSTEMS OK</Text>
        </View>
      </View>

      {statuses.map((s, i) => (
        <View
          key={s.label}
          style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between', paddingVertical: 9,
            borderBottomWidth: i < statuses.length - 1 ? 1 : 0,
            borderBottomColor: C.borderDim,
          }}
        >
          <Text style={{ fontSize: 12, color: C.textSecondary }}>{s.label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={10} color={s.ok ? C.safe : C.textDim} strokeWidth={2.5} />
            <Text style={{ fontSize: 11, color: s.ok ? C.safe : C.textDim, fontWeight: '600' }}>
              {s.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Live Signal Feed ───────────────────────────────────────────────────────────

const SIGNAL_SEVERITY_COLORS: Record<string, string> = {
  info: '#666666',
  low: '#3B82F6',
  medium: '#F59E0B',
  high: '#FF7A00',
  critical: '#FF3B5C',
};

function SignalRow({ event, C, index }: { event: import('@/events/types').OmnyxEvent; C: any; index: number }) {
  const color = SIGNAL_SEVERITY_COLORS[event.severity] ?? C.textDim;
  const diff = Date.now() - event.timestamp;
  const timeStr = diff < 60000 ? `${Math.round(diff / 1000)}s` : `${Math.floor(diff / 60000)}m`;

  return (
    <Animated.View
      key={event.id}
      entering={FadeInDown.delay(index * 40).duration(300)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 9,
        borderBottomWidth: index < 5 ? 1 : 0,
        borderBottomColor: C.borderDim,
      }}
    >
      <View style={{
        width: 7, height: 7, borderRadius: 3.5,
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 }, shadowRadius: 3, shadowOpacity: 0.8,
        flexShrink: 0,
      }} />
      <Text style={{ flex: 1, fontSize: 11, color: C.textSecondary, lineHeight: 15 }} numberOfLines={1}>
        {event.title}
      </Text>
      <View style={{
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
        backgroundColor: `${color}18`,
      }}>
        <Text style={{ fontSize: 7, fontWeight: '700', color, letterSpacing: 0.8 }}>
          {event.severity.toUpperCase()}
        </Text>
      </View>
      <Text style={{ fontSize: 9, color: C.textDim, width: 26, textAlign: 'right' }}>{timeStr}</Text>
    </Animated.View>
  );
}

function LiveSignalFeed({ themeId }: { themeId: string }) {
  const theme = THEMES[themeId as keyof typeof THEMES];
  const C = theme.colors;
  const recentEvents = useAppStore((s) => s.recentEvents);
  const realtimeConnected = useAppStore((s) => s.realtimeConnected);
  const atmosphereLevel = useAppStore((s) => s.atmosphereLevel);
  const scanResult = useAppStore((s) => s.scanResult);

  const displayEvents = recentEvents.slice(0, 6);

  const atmosphereColors: Record<string, string> = {
    calm: C.safe,
    elevated: C.accent,
    tense: '#FF7A00',
    critical: C.threat,
  };
  const atmosphereColor = atmosphereColors[atmosphereLevel] ?? C.textDim;

  const signalPulse = useSharedValue(0.4);

  useEffect(() => {
    signalPulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.4, { duration: 800 })),
      -1, true
    );
    return () => cancelAnimation(signalPulse);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: signalPulse.value }));

  return (
    <View
      style={{
        marginHorizontal: 20, borderRadius: 16, borderWidth: 1,
        borderColor: C.borderDim, backgroundColor: C.surface1,
        padding: 16, marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.textPrimary }}>Live Signals</Text>
          <Text style={{ fontSize: 9, color: C.textDim, marginTop: 2, letterSpacing: 1 }}>REALTIME INTELLIGENCE FEED</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Animated.View style={[{
              width: 5, height: 5, borderRadius: 2.5,
              backgroundColor: atmosphereColor,
              shadowColor: atmosphereColor,
              shadowOffset: { width: 0, height: 0 }, shadowRadius: 3, shadowOpacity: 1,
            }, pulseStyle]} />
            <Text style={{ fontSize: 9, color: atmosphereColor, fontWeight: '700', letterSpacing: 1 }}>
              {atmosphereLevel.toUpperCase()}
            </Text>
          </View>
          {realtimeConnected && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Radio size={9} color={C.safe} strokeWidth={2} />
              <Text style={{ fontSize: 8, color: C.safe, fontWeight: '600' }}>SUPABASE</Text>
            </View>
          )}
        </View>
      </View>

      {displayEvents.length === 0 ? (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: C.textDim }}>
            {scanResult ? 'No signals since last scan.' : 'Run a device scan to generate intelligence signals.'}
          </Text>
        </View>
      ) : (
        displayEvents.map((event, i) => (
          <SignalRow key={event.id} event={event} C={C} index={i} />
        ))
      )}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function IntelligenceScreen() {
  const { currentTheme } = useAppStore();
  const theme = THEMES[currentTheme];
  const C = theme.colors;
  const scanResult = useAppStore((s) => s.scanResult);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={[`${C.primary}09`, 'transparent'] as const}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
          <Text style={{
            fontSize: 24, fontWeight: '700', color: C.textPrimary,
            letterSpacing: 2, marginBottom: 4,
          }}>
            INTELLIGENCE
          </Text>
          <Text style={{ fontSize: 11, color: C.textDim }}>
            Permission analysis and privacy intelligence
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          <ScanPanel themeId={currentTheme} />
          {scanResult && <ScanSummary themeId={currentTheme} />}
          {scanResult && <RiskAppList themeId={currentTheme} />}
          <PrivacyChart themeId={currentTheme} />
          <QuickActions themeId={currentTheme} />
          <SystemStatus themeId={currentTheme} />
          <LiveSignalFeed themeId={currentTheme} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
