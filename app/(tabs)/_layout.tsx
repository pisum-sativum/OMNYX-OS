import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Radio, Bot, Clock, Layers } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';
import { THEMES } from '@/theme';
import { useAppStore } from '@store/useAppStore';
import { useAmbientSystem } from '@/hooks/useAmbientSystem';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import type { AtmosphereLevel } from '@/events/types';

// ─── Dock Configuration ────────────────────────────────────────────────────────

const DOCK_ITEMS = [
  { name: 'index', label: 'CORE', Icon: Shield },
  { name: 'threat-feed', label: 'THREATS', Icon: Radio },
  { name: 'agents', label: 'SWARM', Icon: Bot },
  { name: 'replay', label: 'REPLAY', Icon: Clock },
  { name: 'modes', label: 'MODES', Icon: Layers },
] as const;

const ITEM_W = 64;
const DOCK_PAD = 8;
const DOCK_W = ITEM_W * DOCK_ITEMS.length + DOCK_PAD * 2;

const GLOW_RADIUS: Record<AtmosphereLevel, number> = {
  calm: 7,
  elevated: 12,
  tense: 18,
  critical: 26,
};

const SHADOW_OPACITY: Record<AtmosphereLevel, number> = {
  calm: 0.18,
  elevated: 0.38,
  tense: 0.62,
  critical: 0.88,
};

// Converts 0–1 to 2-digit hex
function opacityHex(opacity: number): string {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
}

const BORDER_OPACITY: Record<AtmosphereLevel, number> = {
  calm: 0.28,
  elevated: 0.50,
  tense: 0.75,
  critical: 0.96,
};

// ─── Signal Dock ───────────────────────────────────────────────────────────────

function SignalDock({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const atmosphereLevel = useAppStore((s) => s.atmosphereLevel);
  const unreadCount = useAppStore((s) => s.unreadThreatCount);
  const currentTheme = useAppStore((s) => s.currentTheme);
  const theme = THEMES[currentTheme];
  const C = theme.colors;

  // Sliding active pill - X is absolute left position within content area
  const slideX = useSharedValue(DOCK_PAD + state.index * ITEM_W);

  useEffect(() => {
    // Only animate for dock items (indices 0–4); unlisted screens leave pill in place
    if (state.index < DOCK_ITEMS.length) {
      slideX.value = withSpring(DOCK_PAD + state.index * ITEM_W, {
        damping: 22,
        stiffness: 220,
      });
    }
  }, [state.index]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const borderColor = `${C.primary}${opacityHex(BORDER_OPACITY[atmosphereLevel])}`;
  const bottomOffset = Math.max(insets.bottom, 6) + 12;

  const dockContent = (
    <View style={{ paddingHorizontal: DOCK_PAD, paddingTop: 9, paddingBottom: 9 }}>
      {/* Sliding active indicator pill */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 5,
            left: 0,
            width: ITEM_W,
            height: 54,
            borderRadius: 17,
            backgroundColor: `${C.primary}18`,
            borderWidth: 1,
            borderColor: `${C.primary}30`,
          },
          slideStyle,
        ]}
      />

      {/* Tab items */}
      <View style={{ flexDirection: 'row' }}>
        {DOCK_ITEMS.map((item, i) => {
          const isFocused = state.index === i;
          const { Icon } = item;
          const hasBadge = i === 1 && unreadCount > 0;

          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
              style={{
                width: ITEM_W,
                height: 46,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <Icon
                  size={isFocused ? 20 : 18}
                  color={isFocused ? C.primary : C.textDim}
                  strokeWidth={isFocused ? 2.2 : 1.5}
                />
                {isFocused && (
                  <View style={{
                    position: 'absolute',
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: `${C.primary}18`,
                    shadowColor: C.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: 8, shadowOpacity: 0.6,
                  }} />
                )}
                {hasBadge && (
                  <View style={{
                    position: 'absolute', top: -5, right: -8,
                    backgroundColor: '#FF3B5C', borderRadius: 6,
                    minWidth: 14, height: 14,
                    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
                  }}>
                    <Text style={{ color: '#ffffff', fontSize: 7, fontWeight: '800' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{
                fontSize: 7,
                letterSpacing: 1,
                fontWeight: isFocused ? '800' : '500',
                color: isFocused ? C.primary : C.textDim,
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: 0,
        right: 0,
        alignItems: 'center',
      }}
    >
      {/* Shadow wrapper - must not clip, so shadow isn't cut off */}
      <View
        style={{
          borderRadius: 28,
          shadowColor: C.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: GLOW_RADIUS[atmosphereLevel],
          shadowOpacity: SHADOW_OPACITY[atmosphereLevel],
          elevation: 14,
        }}
      >
        {/* Clip wrapper - BlurView / solid background */}
        <View
          style={{
            width: DOCK_W,
            borderRadius: 28,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: borderColor,
          }}
        >
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={theme.isDark ? 22 : 65}
              tint={theme.isDark ? 'dark' : 'light'}
            >
              {dockContent}
            </BlurView>
          ) : (
            <View style={{ backgroundColor: C.tabBarBg }}>{dockContent}</View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Tab Layout ────────────────────────────────────────────────────────────────

export default function TabLayout() {
  useAmbientSystem();
  useRealtimeEvents();

  return (
    <Tabs
      tabBar={(props) => <SignalDock {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="threat-feed" />
      <Tabs.Screen name="agents" />
      <Tabs.Screen name="replay" />
      <Tabs.Screen name="modes" />
      <Tabs.Screen name="intelligence" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
