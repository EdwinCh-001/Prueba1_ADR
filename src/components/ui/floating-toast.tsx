import { useEffect } from 'react';
import { Text } from './text';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

export type FloatingToastTone = 'success' | 'info';

export interface FloatingToastMessage {
  id: number;
  message: string;
  tone: FloatingToastTone;
}

interface FloatingToastProps {
  toast: FloatingToastMessage | null;
  onDismiss: () => void;
}

const toneClasses: Record<FloatingToastTone, { container: string; text: string }> = {
  success: { container: 'border-success bg-success-soft', text: 'text-success' },
  info: { container: 'border-brand-light bg-brand-soft', text: 'text-brand-dark' },
};

const animateToast = (progress: SharedValue<number>, target: number): void => {
  'worklet';
  progress.value = withTiming(target, { duration: target === 1 ? 320 : 220 });
};

export function FloatingToast({
  toast,
  onDismiss,
}: FloatingToastProps): React.JSX.Element {
  const progress = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-96, 0]) }],
  }));
  const toastId = toast?.id ?? null;

  useEffect(() => {
    if (toastId === null) {
      scheduleOnUI(animateToast, progress, 0);
      return;
    }

    scheduleOnUI(animateToast, progress, 1);
    const timeoutId = setTimeout(onDismiss, 3200);

    return () => clearTimeout(timeoutId);
  }, [onDismiss, progress, toastId]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      className={`absolute left-4 right-4 top-12 z-50 rounded-2xl border px-4 py-3 shadow-lg ${toast ? toneClasses[toast.tone].container : 'border-transparent bg-transparent'}`}
      pointerEvents={toast ? 'auto' : 'none'}
      style={animatedStyle}
    >
      <Text className={`text-sm font-bold ${toast ? toneClasses[toast.tone].text : 'text-content'}`}>
        {toast?.message}
      </Text>
    </Animated.View>
  );
}
