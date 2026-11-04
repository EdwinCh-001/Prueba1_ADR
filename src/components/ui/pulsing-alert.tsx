import type { ViewProps } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

interface PulsingAlertProps extends Pick<ViewProps, 'children'> {
  active: boolean;
  className?: string;
}

const animateAlert = (progress: SharedValue<number>, active: boolean): void => {
  'worklet';
  progress.value = active
    ? withRepeat(
      withSequence(
        withTiming(1, { duration: 650 }),
        withTiming(0, { duration: 650 }),
      ),
      -1,
      false,
    )
    : withTiming(0, { duration: 180 });
};

export function PulsingAlert({
  active,
  children,
  className,
}: PulsingAlertProps): React.JSX.Element {
  const progress = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.9]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.02]) }],
  }));

  useEffect(() => {
    scheduleOnUI(animateAlert, progress, active);
  }, [active, progress]);

  return (
    <Animated.View className={className} style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
