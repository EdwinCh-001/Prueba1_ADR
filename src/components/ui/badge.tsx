import { Text } from 'react-native';

interface BadgeProps {
  label: string;
}

export function Badge({ label }: BadgeProps): React.JSX.Element {
  return (
    <Text className="self-start rounded-lg border border-brand-light px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-light">
      {label}
    </Text>
  );
}
