import { Pressable, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, disabled }: ButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      className="h-14 items-center justify-center rounded-full bg-action active:bg-action-pressed disabled:opacity-50"
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-base font-extrabold uppercase tracking-wider text-on-action">{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled }: ButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      className="h-14 items-center justify-center rounded-full border border-brand-light active:bg-brand-soft disabled:opacity-50"
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-base font-bold text-brand-light">{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  tone = 'muted',
}: ButtonProps & { tone?: 'muted' | 'danger' }): React.JSX.Element {
  const textClass = tone === 'danger' ? 'text-danger' : 'text-content-muted';
  return (
    <Pressable
      accessibilityRole="button"
      className="h-12 items-center justify-center rounded-full active:bg-surface"
      onPress={onPress}
    >
      <Text className={`text-base font-semibold ${textClass}`}>{label}</Text>
    </Pressable>
  );
}
