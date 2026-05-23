import { View, ScrollView, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  EyeOff,
  Lock,
  Moon,
  Globe,
  Target,
  Check,
  Settings,
  Cpu,
  Layers,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { THEMES, THEME_LIST } from '@/theme';
import type { ThemeId } from '@/theme';
import type { PrivacyMode } from '@/types';
import { useAppStore } from '@store/useAppStore';
import { useRouter } from 'expo-router';
import type { AtmosphereLevel } from '@/events/types';

// ─── Mode Definitions ──────────────────────────────────────────────────────────

interface ModeDefinition {
  id: PrivacyMode;
  label: string;
  Icon: any;
  color: string;
  description: string;
  tags: string[];
}

const MODES: ModeDefinition[] = [
  {
    id: 'normal',
    label: 'NORMAL',
    Icon: Shield,
    color: '#9966FF',
    description: 'Baseline protection active',
    tags: ['Monitoring', 'Standard'],
  },
  {
    id: 'ghost',
    label: 'GHOST',
    Icon: EyeOff,
    color: '#00CCFF',
    description: 'Full tracking suppression',
    tags: ['Location alerts on', 'Mic apps flagged'],
  },
  {
    id: 'banking',
    label: 'BANKING',
    Icon: Lock,
    color: '#00DD77',
    description: 'Financial transaction guard',
    tags: ['Clipboard risks tracked', 'Net risks surfaced'],
  },
  {
    id: 'sleep',
    label: 'SLEEP',
    Icon: Moon,
    color: '#8866BB',
    description: 'Minimal background footprint',
    tags: ['BG risk alerts on', 'Low activity'],
  },
  {
    id: 'travel',
    label: 'TRAVEL',
    Icon: Globe,
    color: '#FF8800',
    description: 'Cross-border data protection',
    tags: ['Location alerts on', 'Net risks surfaced'],
  },
  {
    id: 'focus',
    label: 'FOCUS',
    Icon: Target,
    color: '#FF3B5C',
    description: 'Zero-distraction isolation',
    tags: ['Notifs blocked', 'Essential only'],
  },
];

const ATMOSPHERE_HEADER_COLOR: Record<AtmosphereLevel, string> = {
  calm: '#443377',
  elevated: '#FFBB00',
  tense: '#FF7A00',
  critical: '#FF1144',
};

// ─── Active Mode Banner ────────────────────────────────────────────────────────

function ActiveModeBanner({
  mode,
  C,
}: {
  mode: ModeDefinition;
  C: any;
}) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 20,
        backgroundColor: `${mode.color}0D`,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: `${mode.color}3A`,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: `${mode.color}18`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: `${mode.color}30`,
            marginRight: 14,
          }}
        >
          <mode.Icon size={20} color={mode.color} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: mode.color,
              letterSpacing: 1.5,
            }}
          >
            {mode.label}
          </Text>
          <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
            {mode.description}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: `${mode.color}18`,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: `${mode.color}30`,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: '700',
              color: mode.color,
              letterSpacing: 1.2,
            }}
          >
            ACTIVE
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {mode.tags.map((tag) => (
          <View
            key={tag}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              backgroundColor: `${mode.color}12`,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: `${mode.color}22`,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: mode.color,
                fontWeight: '600',
                letterSpacing: 0.5,
              }}
            >
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Mode Grid Card ────────────────────────────────────────────────────────────

function ModeCard({
  mode,
  isActive,
  onSelect,
  C,
  delay,
}: {
  mode: ModeDefinition;
  isActive: boolean;
  onSelect: () => void;
  C: any;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(280)}
      style={{ flex: 1 }}
    >
      <TouchableOpacity
        onPress={onSelect}
        activeOpacity={0.75}
        style={{
          padding: 16,
          backgroundColor: isActive ? `${mode.color}0E` : C.surface1,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: isActive ? `${mode.color}50` : C.borderDim,
          minHeight: 115,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: `${mode.color}16`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <mode.Icon
              size={18}
              color={isActive ? mode.color : C.textSecondary}
              strokeWidth={1.5}
            />
          </View>
          {isActive && <Check size={14} color={mode.color} strokeWidth={2.5} />}
        </View>

        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.2,
            color: isActive ? mode.color : C.textPrimary,
            marginBottom: 4,
          }}
        >
          {mode.label}
        </Text>
        <Text style={{ fontSize: 10, color: C.textDim, lineHeight: 14 }}>
          {mode.description}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Theme Thumbnail ───────────────────────────────────────────────────────────

function ThemeThumbnail({ id, isActive }: { id: ThemeId; isActive: boolean }) {
  const t = THEME_LIST.find((x) => x.id === id)!;
  const tc = THEMES[id].colors;
  return (
    <View
      style={{
        width: 54,
        height: 40,
        borderRadius: 10,
        overflow: 'hidden',
        marginRight: 14,
        borderWidth: 1.5,
        borderColor: isActive ? t.previewColor : tc.borderDim,
        backgroundColor: tc.bg,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 3, padding: 6, paddingBottom: 0 }}>
        <View
          style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: t.previewColor }}
        />
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: tc.accent,
            opacity: 0.85,
          }}
        />
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: tc.safe,
            opacity: 0.65,
          }}
        />
      </View>
      <LinearGradient
        colors={[`${t.previewColor}60`, t.previewColor] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 }}
      />
    </View>
  );
}

// ─── Theme Switcher ────────────────────────────────────────────────────────────

function ThemeSwitcher({
  currentTheme,
  onSelect,
  C,
}: {
  currentTheme: ThemeId;
  onSelect: (id: ThemeId) => void;
  C: any;
}) {
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 10,
          letterSpacing: 2.5,
          color: C.textDim,
          marginBottom: 10,
          fontWeight: '600',
        }}
      >
        DISPLAY THEME
      </Text>
      <View
        style={{
          backgroundColor: C.surface1,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.borderDim,
          overflow: 'hidden',
        }}
      >
        {THEME_LIST.map((t, i) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => onSelect(t.id)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: i < THEME_LIST.length - 1 ? 1 : 0,
              borderBottomColor: C.borderDim,
              backgroundColor:
                currentTheme === t.id ? `${t.previewColor}0E` : 'transparent',
            }}
          >
            <ThemeThumbnail id={t.id} isActive={currentTheme === t.id} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: currentTheme === t.id ? '700' : '500',
                  color: currentTheme === t.id ? t.previewColor : C.textPrimary,
                }}
              >
                {t.label}
              </Text>
              <Text style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                {t.description}
              </Text>
            </View>
            {currentTheme === t.id && (
              <Check size={16} color={t.previewColor} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Advanced Nav Row ──────────────────────────────────────────────────────────

function NavRow({
  Icon,
  label,
  subtitle,
  color,
  onPress,
  isLast,
  C,
}: {
  Icon: any;
  label: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  isLast?: boolean;
  C: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: C.borderDim,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: `${color}14`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Icon size={16} color={color} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: C.textPrimary }}>{label}</Text>
        <Text style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <View
        style={{
          width: 6,
          height: 6,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: C.textDim,
          transform: [{ rotate: '45deg' }],
          marginRight: 2,
        }}
      />
    </TouchableOpacity>
  );
}

// ─── Modes Screen ─────────────────────────────────────────────────────────────

export default function ModesScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  const privacyMode = useAppStore((s) => s.privacyMode);
  const setPrivacyMode = useAppStore((s) => s.setPrivacyMode);
  const currentTheme = useAppStore((s) => s.currentTheme);
  const setTheme = useAppStore((s) => s.setTheme);
  const atmosphereLevel = useAppStore((s) => s.atmosphereLevel);

  const theme = THEMES[currentTheme];
  const C = theme.colors;

  const activeMode = MODES.find((m) => m.id === privacyMode) ?? MODES[0];
  const cardGap = 10;
  const cardWidth = (width - 40 - cardGap) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={[`${C.primary}0A`, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 20,
          }}
        >
          <Layers size={18} color={C.primary} strokeWidth={1.5} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '800',
                  color: C.textPrimary,
                  letterSpacing: 2,
                }}
              >
                MODES
              </Text>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: ATMOSPHERE_HEADER_COLOR[atmosphereLevel],
                }}
              />
            </View>
            <Text style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
              Operational profile · Privacy enforcement
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.navigate('/(tabs)/settings')}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: C.glass1,
              borderWidth: 1,
              borderColor: C.borderDim,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={16} color={C.textSecondary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Active mode banner */}
          <ActiveModeBanner mode={activeMode} C={C} />

          {/* Mode grid */}
          <Text
            style={{
              fontSize: 10,
              letterSpacing: 2.5,
              color: C.textDim,
              marginHorizontal: 20,
              marginBottom: 12,
              fontWeight: '600',
            }}
          >
            SELECT MODE
          </Text>

          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 28,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: cardGap,
            }}
          >
            {MODES.map((mode, i) => (
              <View key={mode.id} style={{ width: cardWidth }}>
                <ModeCard
                  mode={mode}
                  isActive={privacyMode === mode.id}
                  onSelect={() => setPrivacyMode(mode.id)}
                  C={C}
                  delay={i * 40}
                />
              </View>
            ))}
          </View>

          {/* Theme switcher */}
          <ThemeSwitcher currentTheme={currentTheme} onSelect={setTheme} C={C} />

          {/* Advanced nav */}
          <Text
            style={{
              fontSize: 10,
              letterSpacing: 2.5,
              color: C.textDim,
              marginHorizontal: 20,
              marginBottom: 10,
              fontWeight: '600',
            }}
          >
            ADVANCED
          </Text>
          <View
            style={{
              marginHorizontal: 20,
              backgroundColor: C.surface1,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.borderDim,
              overflow: 'hidden',
              marginBottom: 32,
            }}
          >
            <NavRow
              Icon={Cpu}
              label="Intelligence"
              subtitle="Live signal feed · System status · Scan engine"
              color={C.accent}
              onPress={() => router.navigate('/(tabs)/intelligence')}
              C={C}
            />
            <NavRow
              Icon={Settings}
              label="Configuration"
              subtitle="AI agents · Notifications · System settings"
              color={C.textSecondary}
              onPress={() => router.navigate('/(tabs)/settings')}
              isLast
              C={C}
            />
          </View>

          <View style={{ alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontSize: 10, color: C.textDim, letterSpacing: 0.5 }}>
              OMNYX v1.0.0 · Privacy Intelligence Layer
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
