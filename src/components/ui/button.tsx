import { ActivityIndicator, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

import { Text } from './text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const animateButtonPress = (
  scale: SharedValue<number>,
  offsetY: SharedValue<number>,
  pressed: boolean,
): void => {
  'worklet';
  scale.value = withSpring(pressed ? 0.94 : 1, {
    damping: pressed ? 13 : 10,
    stiffness: pressed ? 300 : 240,
    mass: 0.65,
  });
  offsetY.value = withSpring(pressed ? 2 : 0, {
    damping: 14,
    stiffness: 280,
    mass: 0.6,
  });
};

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  offline?: boolean;
  requiresConnection?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  variant?: ButtonVariant;
  tone?: 'muted' | 'danger';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'h-14 items-center justify-center rounded-full bg-action shadow-md shadow-black/15 active:bg-action-pressed',
  secondary: 'h-14 items-center justify-center rounded-full border border-brand-light bg-surface shadow-sm shadow-black/10 active:bg-brand-soft',
  danger: 'h-14 items-center justify-center rounded-full bg-danger shadow-md shadow-black/15 active:bg-danger/80',
  ghost: 'h-12 items-center justify-center rounded-full active:bg-surface-raised',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-base font-bold text-on-action',
  secondary: 'text-base font-bold text-brand-light',
  danger: 'text-base font-bold text-white',
  ghost: 'text-base font-semibold text-content-muted',
};

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  offline = false,
  requiresConnection = false,
  accessibilityLabel,
  accessibilityHint,
  variant = 'primary',
  tone = 'muted',
}: ButtonProps): React.JSX.Element {
  const isBlocked = disabled || loading || (requiresConnection && offline);
  const resolvedVariant = variant === 'ghost' && tone === 'danger' ? 'ghost' : variant;
  const textClass = variant === 'ghost' && tone === 'danger' ? 'text-base font-semibold text-danger' : variantTextClasses[resolvedVariant];
  const scale = useSharedValue(1);
  const offsetY = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.value }, { scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint ?? (requiresConnection && offline ? 'Requiere conexión a internet.' : undefined)}
      accessibilityState={{ busy: loading, disabled: isBlocked }}
      className={`${variantClasses[resolvedVariant]} ${isBlocked ? 'opacity-50' : ''}`}
      disabled={isBlocked}
      onPressIn={() => {
        if (!isBlocked) {
          scheduleOnUI(animateButtonPress, scale, offsetY, true);
        }
      }}
      onPressOut={() => {
        scheduleOnUI(animateButtonPress, scale, offsetY, false);
      }}
      onPress={() => {
        if (!isBlocked) {
          onPress();
        }
      }}
      style={animatedStyle}
    >
      {loading ? <ActivityIndicator colorClassName={resolvedVariant === 'primary' || resolvedVariant === 'danger' ? 'accent-on-action' : 'accent-brand-light'} /> : (
        <Text className={textClass}>{requiresConnection && offline ? 'Sin conexión' : label}</Text>
      )}
    </AnimatedPressable>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, 'variant'>): React.JSX.Element {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>): React.JSX.Element {
  return <Button {...props} variant="secondary" />;
}

export function GhostButton(props: Omit<ButtonProps, 'variant'>): React.JSX.Element {
  return <Button {...props} variant="ghost" />;
}
