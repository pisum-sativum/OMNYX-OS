/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Mocks for native/animation modules that the replay screen imports at module
 * load time. We swap them for a plain View so component logic (which text gets
 * rendered, badge contents, etc.) can be asserted in a node environment.
 *
 * NOTE: factories must not contain JSX or React.createElement — the
 * nativewind babel transform rewrites those into a helper that is out of scope
 * inside jest's hoisted mock factories. Returning react-native's View directly
 * sidesteps that entirely.
 */

// react-native-reanimated: Animated.View -> View; hooks/helpers become no-ops.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const passthrough = (v) => v;
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    withTiming: passthrough,
    withSpring: passthrough,
    withSequence: passthrough,
    withRepeat: passthrough,
    cancelAnimation: () => {},
  };
});

// lucide-react-native: trend icons aren't relevant to text assertions.
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return { TrendingDown: View, TrendingUp: View, Minus: View };
});

// react-native-svg: used only by the waveform panel.
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Svg: View,
    Path: View,
    Circle: View,
    Defs: View,
    LinearGradient: View,
    Stop: View,
  };
});

// expo-linear-gradient: render as a plain View.
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

// react-native-safe-area-context: bypass native measurement.
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// useAppStore drags in zustand + persistence + mock data; the MemoryNode test
// doesn't touch the store, so stub it out to keep the import graph light.
jest.mock('@store/useAppStore', () => ({
  useAppStore: () => ({}),
}));
