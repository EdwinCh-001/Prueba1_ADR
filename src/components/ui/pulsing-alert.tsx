import { View, type ViewProps } from 'react-native';
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
  haloClassName?: string;
}

const animateAlert = (progress: SharedValue<number>, active: boolean): void => {
  'worklet';
  progress.value = active
    ? withRepeat(
      withSequence(
        withTiming(1, { duration: 280 }),
        withTiming(0, { duration: 520 }),
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
  haloClassName = 'border-white',
}: PulsingAlertProps): React.JSX.Element {
  const progress = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.9]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -3]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.16]) },
    ],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.8]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.9, 1.5]) }],
  }));

  useEffect(() => {
    scheduleOnUI(animateAlert, progress, active);
  }, [active, progress]);

  return (
    <Animated.View className={className} style={animatedStyle}>
      <View className="relative">
        {active ? (
          <Animated.View
            accessible={false}
            className={`absolute inset-0 rounded-full border-2 ${haloClassName}`}
            pointerEvents="none"
            style={haloStyle}
          />
        ) : null}
        {children}
      </View>
    </Animated.View>
  );
}
