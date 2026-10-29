import { Text } from 'react-native';

export type IconName =
  | 'access'
  | 'person'
  | 'lock'
  | 'arrow-forward'
  | 'online'
  | 'warning'
  | 'pending';

const glyphs: Record<IconName, string> = {
  access: '◈',
  person: '◉',
  lock: '▣',
  'arrow-forward': '→',
  online: '●',
  warning: '!',
  pending: '↻',
};

interface IconProps {
  name: IconName;
  className?: string;
  accessibilityLabel?: string;
}

export function Icon({
  name,
  className = '',
  accessibilityLabel,
}: IconProps): React.JSX.Element {
  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      className={`text-base font-bold text-brand ${className}`}
    >
      {glyphs[name]}
    </Text>
  );
}
