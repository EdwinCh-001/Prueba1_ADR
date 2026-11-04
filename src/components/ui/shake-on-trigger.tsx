import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

interface ShakeOnTriggerProps extends Pick<ViewProps, 'children'> {
  trigger: number;
  className?: string;
}

const startShake = (translateX: SharedValue<number>): void => {
  'worklet';
  translateX.value = withSequence(
    withTiming(-5, { duration: 55 }),
    withTiming(5, { duration: 55 }),
    withTiming(-3, { duration: 55 }),
    withTiming(3, { duration: 55 }),
    withTiming(0, { duration: 65 }),
  );
};

export function ShakeOnTrigger({
  children,
  trigger,
  className,
}: ShakeOnTriggerProps): React.JSX.Element {
  const translateX = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    if (trigger === 0) {
      return;
    }

    scheduleOnUI(startShake, translateX);
  }, [trigger, translateX]);

  return (
    <Animated.View className={className} style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
