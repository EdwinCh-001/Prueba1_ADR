import { Text, View } from 'react-native';

interface KeyValueRowProps {
  label: string;
  value: string;
  last?: boolean;
}

export function KeyValueRow({ label, value, last = false }: KeyValueRowProps): React.JSX.Element {
  return (
    <View className={`flex-row gap-4 py-3 ${last ? '' : 'border-b border-line'}`}>
      <Text className="shrink-0 text-sm text-content-muted">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-content">{value}</Text>
    </View>
  );
}
