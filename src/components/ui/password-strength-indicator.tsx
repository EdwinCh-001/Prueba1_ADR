import { useEffect } from 'react';
import { View } from 'react-native';

import { Text } from './text';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

interface PasswordStrengthAssessment {
  level: PasswordStrength;
  score: number;
}

export const assessPasswordStrength = (password: string): PasswordStrengthAssessment => {
  const score = [
    password.length >= 8,
    /\d/.test(password),
    /[A-Z]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const level: PasswordStrength = password.length < 6 || score <= 1
    ? 'weak'
    : score === 4
      ? 'strong'
      : 'medium';

  return { level, score };
};

const strengthClasses: Record<
  PasswordStrength,
  { bar: string; label: string; text: string }
> = {
  weak: {
    bar: 'bg-danger',
    label: 'Débil',
    text: 'text-danger',
  },
  medium: {
    bar: 'bg-warning',
    label: 'Media',
    text: 'text-warning',
  },
  strong: {
    bar: 'bg-success',
    label: 'Fuerte',
    text: 'text-success',
  },
};

const animateProgress = (progress: SharedValue<number>, target: number): void => {
  'worklet';
  progress.value = withTiming(target, { duration: 260 });
};

const indicatorEntering = FadeIn.duration(420);
const indicatorExiting = FadeOut.duration(300);
const indicatorLayout = Layout.duration(200);

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps): React.JSX.Element | null {
  const { level: strength, score } = assessPasswordStrength(password);
  const styles = strengthClasses[strength];
  const progress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));
  const targetProgress = score * 25;

  useEffect(() => {
    scheduleOnUI(animateProgress, progress, targetProgress);
  }, [progress, targetProgress]);

  if (!password) {
    return null;
  }

  return (
    <Animated.View
      className="gap-1"
      entering={indicatorEntering}
      exiting={indicatorExiting}
      layout={indicatorLayout}
      accessibilityLiveRegion="polite"
    >
      <View className="h-2 overflow-hidden rounded-full bg-surface-raised">
        <Animated.View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 4, now: score }}
          className={`h-full rounded-full ${styles.bar}`}
          style={progressStyle}
        />
      </View>
      <Text className={`text-xs font-semibold ${styles.text}`}>
        Seguridad: {styles.label}
      </Text>
      <Text className="text-xs text-content-subtle">
        Usa al menos 8 caracteres, números, mayúsculas y símbolos.
      </Text>
    </Animated.View>
  );
}
