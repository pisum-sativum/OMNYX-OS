import { View, ScrollView, Text, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Brain,
  Lock,
  Shield,
  ChevronRight,
  LogOut,
  Cpu,
  Eye,
  Zap,
  Palette,
  Check,
} from 'lucide-react-native';
import { useState } from 'react';

import { THEMES, THEME_LIST } from '@/theme';
import type { ThemeId } from '@/theme';

// ─── Theme Thumbnail ───────────────────────────────────────────────────────────

function ThemeThumbnail({ id, isActive }: { id: ThemeId; isActive: boolean }) {
  const t = THEME_LIST.find((x) => x.id === id)!;
  const tc = THEMES[id].colors;
  return (
    <View style={{
      width: 54,
      height: 40,
      borderRadius: 10,
      overflow: 'hidden',
      marginRight: 14,
      borderWidth: 1.5,
      borderColor: isActive ? t.previewColor : tc.borderDim,
      backgroundColor: tc.bg,
    }}>
      {/* top row: three color dots */}
      <View style={{ flexDirection: 'row', gap: 3, padding: 6, paddingBottom: 0 }}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: t.previewColor }} />
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: tc.accent, opacity: 0.85 }} />
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: tc.safe, opacity: 0.65 }} />
      </View>
      {/* bottom gradient bar */}
      <LinearGradient
        colors={[`${t.previewColor}60`, t.previewColor] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 }}
      />
    </View>
  );
}
import { useAppStore } from '@store/useAppStore';

function Section({
  title,
  children,
  C,
}: {
  title: string;
  children: React.ReactNode;
  C: any;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
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
        {title}
      </Text>
      <View
        style={{
          marginHorizontal: 20,
          backgroundColor: C.surface1,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.borderDim,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

interface RowProps {
  Icon: any;
  label: string;
  subtitle?: string;
  color?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
  C: any;
}

function Row({
  Icon,
  label,
  subtitle,
  color,
  value,
  onToggle,
  onPress,
  destructive,
  isLast,
  C,
}: RowProps) {
  const iconColor = color ?? C.textSecondary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && onToggle === undefined}
      activeOpacity={onPress ? 0.7 : 1}
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
          backgroundColor: destructive ? `${C.threat}14` : `${iconColor}14`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Icon size={16} color={destructive ? C.threat : iconColor} strokeWidth={1.5} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            color: destructive ? C.threat : C.textPrimary,
            fontWeight: '500',
          }}
        >
          {label}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 11, color: C.textDim, marginTop: 2, lineHeight: 15 }}>
            {subtitle}
          </Text>
        )}
      </View>

      {onToggle !== undefined && (
        <Switch
          value={value}
          onValueChange={onToggle}
          thumbColor={value ? '#fff' : C.textDim}
          trackColor={{ false: C.glass2, true: `${C.primary}90` }}
          ios_backgroundColor={C.glass2}
        />
      )}
      {onPress && onToggle === undefined && (
        <ChevronRight size={16} color={C.textDim} />
      )}
    </TouchableOpacity>
  );
}

function ThemeSwitcher({ currentTheme, onSelect, C }: {
  currentTheme: ThemeId;
  onSelect: (id: ThemeId) => void;
  C: any;
}) {
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
      <Text style={{
        fontSize: 10,
        letterSpacing: 2.5,
        color: C.textDim,
        marginBottom: 10,
        fontWeight: '600',
      }}>
        DISPLAY THEME
      </Text>
      <View style={{
        backgroundColor: C.surface1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.borderDim,
        overflow: 'hidden',
      }}>
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
              backgroundColor: currentTheme === t.id ? `${t.previewColor}0E` : 'transparent',
            }}
          >
            <ThemeThumbnail id={t.id} isActive={currentTheme === t.id} />
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: currentTheme === t.id ? '700' : '500',
                color: currentTheme === t.id ? t.previewColor : C.textPrimary,
              }}>
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

export default function SettingsScreen() {
  const { privacyScore, privacyMode, currentTheme, setTheme } = useAppStore();
  const theme = THEMES[currentTheme];
  const C = theme.colors;

  const [notifications, setNotifications] = useState(true);
  const [autoBlock, setAutoBlock] = useState(false);
  const [aiExplanations, setAiExplanations] = useState(true);
  const [aggressiveMode, setAggressiveMode] = useState(false);
  const [adaptiveLearning, setAdaptiveLearning] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={[`${C.primary}0A`, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: C.textPrimary,
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            CONFIG
          </Text>
          <Text style={{ fontSize: 11, color: C.textDim }}>
            Configure your privacy intelligence layer
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Account */}
          <Section title="ACCOUNT" C={C}>
            <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: C.borderDim }}>
              <View style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: `${C.primary}18`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                borderWidth: 1.5,
                borderColor: `${C.primary}40`,
              }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: C.primary }}>O</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 }}>
                OMNYX User
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.primary }} />
                  <Text style={{ fontSize: 11, color: C.textDim }}>Score {privacyScore.current}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.accent }} />
                  <Text style={{ fontSize: 11, color: C.textDim }}>
                    {privacyMode === 'normal' ? 'Standard' : privacyMode.charAt(0).toUpperCase() + privacyMode.slice(1)} mode
                  </Text>
                </View>
              </View>
            </View>
            <Row Icon={LogOut} label="Sign Out" destructive isLast onPress={() => {}} C={C} />
          </Section>

          {/* Theme */}
          <ThemeSwitcher currentTheme={currentTheme} onSelect={setTheme} C={C} />

          {/* Intelligence */}
          <Section title="PRIVACY INTELLIGENCE" C={C}>
            <Row
              Icon={Bell}
              label="Threat Notifications"
              subtitle="Alerts for critical and high risk events"
              color={C.primary}
              value={notifications}
              onToggle={setNotifications}
              C={C}
            />
            <Row
              Icon={Shield}
              label="Auto-Block Threats"
              subtitle="Autonomously respond to detected threats"
              color={C.threat}
              value={autoBlock}
              onToggle={setAutoBlock}
              C={C}
            />
            <Row
              Icon={Brain}
              label="AI Explanations"
              subtitle="Human-readable threat analysis on every event"
              color={C.accent}
              value={aiExplanations}
              onToggle={setAiExplanations}
              C={C}
            />
            <Row
              Icon={Lock}
              label="Aggressive Protection"
              subtitle="Maximum permission restriction mode"
              color={C.warning}
              value={aggressiveMode}
              onToggle={setAggressiveMode}
              isLast
              C={C}
            />
          </Section>

          {/* AI Agents */}
          <Section title="AI AGENTS" C={C}>
            <Row
              Icon={Cpu}
              label="Adaptive Learning"
              subtitle="Agents learn your usage patterns over time"
              color={C.primary}
              value={adaptiveLearning}
              onToggle={setAdaptiveLearning}
              C={C}
            />
            <Row
              Icon={Eye}
              label="Agent Visibility"
              subtitle="Show agent activity in real time"
              color={C.accent}
              onPress={() => {}}
              C={C}
            />
            <Row
              Icon={Zap}
              label="Automation Rules"
              subtitle="Configure autonomous response triggers"
              color={C.warning}
              onPress={() => {}}
              isLast
              C={C}
            />
          </Section>

          {/* System */}
          <Section title="SYSTEM" C={C}>
            <Row
              Icon={Shield}
              label="Threat Sensitivity"
              subtitle="Adjust detection threshold"
              C={C}
              onPress={() => {}}
            />
            <Row
              Icon={Brain}
              label="AI Model"
              subtitle="AI Proxy (haiku-class)"
              C={C}
              onPress={() => {}}
              isLast
            />
          </Section>

          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontSize: 11, color: C.textDim, letterSpacing: 0.5 }}>OMNYX v1.0.0</Text>
            <Text style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>Privacy Intelligence Layer</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
