import { Text } from 'react-native';

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

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
}

export function StatusChip({ label, tone = 'neutral' }: StatusChipProps): React.JSX.Element {
  return (
    <Text
      className={`self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${containerTones[tone]} ${textTones[tone]}`}
    >
      {label}
    </Text>
  );
}
