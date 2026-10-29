import { ActivityIndicator, Pressable, Text } from 'react-native';

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
  primary: 'h-14 items-center justify-center rounded-full bg-action active:bg-action-pressed',
  secondary: 'h-14 items-center justify-center rounded-full border border-brand-light active:bg-brand-soft',
  danger: 'h-14 items-center justify-center rounded-full bg-danger active:bg-danger/80',
  ghost: 'h-12 items-center justify-center rounded-full active:bg-surface-raised',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-base font-extrabold uppercase tracking-wider text-on-action',
  secondary: 'text-base font-bold text-brand-light',
  danger: 'text-base font-extrabold uppercase tracking-wider text-white',
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint ?? (requiresConnection && offline ? 'Requiere conexión a internet.' : undefined)}
      accessibilityState={{ busy: loading, disabled: isBlocked }}
      className={`${variantClasses[resolvedVariant]} ${isBlocked ? 'opacity-50' : ''}`}
      disabled={isBlocked}
      onPress={() => {
        if (!isBlocked) {
          onPress();
        }
      }}
    >
      {loading ? <ActivityIndicator colorClassName={resolvedVariant === 'primary' || resolvedVariant === 'danger' ? 'accent-on-action' : 'accent-brand-light'} /> : (
        <Text className={textClass}>{requiresConnection && offline ? 'Sin conexión' : label}</Text>
      )}
    </Pressable>
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
