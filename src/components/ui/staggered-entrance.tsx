import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

interface StaggeredEntranceProps extends Pick<ViewProps, 'children'> {
  delayMs: number;
  className?: string;
}

const startEntrance = (progress: SharedValue<number>, delayMs: number): void => {
  'worklet';
  progress.value = withDelay(
    delayMs,
    withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
  );
};

export function StaggeredEntrance({
  children,
  delayMs,
  className,
}: StaggeredEntranceProps): React.JSX.Element {
  const progress = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 48 },
      { scale: 0.88 + progress.value * 0.12 },
      { rotate: `${(1 - progress.value) * -3}deg` },
    ],
  }));

  useEffect(() => {
    scheduleOnUI(startEntrance, progress, delayMs);
  }, [delayMs, progress]);

  return (
    <Animated.View className={className} style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
