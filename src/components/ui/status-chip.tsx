import { Text, View } from 'react-native';

import { Icon, type IconName } from './icon';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const containerTones: Record<StatusTone, string> = {
  success: 'border-success bg-success-soft',
  warning: 'border-warning bg-warning-soft',
  danger: 'border-danger bg-danger-soft',
  info: 'border-brand-light bg-brand-soft',
  neutral: 'border-line bg-surface-raised',
};

const textTones: Record<StatusTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-brand-light',
  neutral: 'text-content-muted',
};

const toneIcons: Record<StatusTone, IconName> = {
  success: 'online',
  warning: 'warning',
  danger: 'warning',
  info: 'access',
  neutral: 'pending',
};

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  showIcon?: boolean;
  className?: string;
}

export function StatusChip({
  label,
  tone = 'neutral',
  showIcon = false,
  className = '',
}: StatusChipProps): React.JSX.Element {
  return (
    <View className={`self-start flex-row items-center gap-1 rounded-full border px-3 py-1 ${containerTones[tone]} ${className}`}>
      {showIcon ? <Icon name={toneIcons[tone]} className={`text-xs ${textTones[tone]}`} accessibilityLabel={label} /> : null}
      <Text className={`text-xs font-semibold uppercase tracking-wide ${textTones[tone]}`}>{label}</Text>
    </View>
  );
}
