import { Text, View } from 'react-native';

interface BadgeProps {
  label: string;
}

export function Badge({ label }: BadgeProps): React.JSX.Element {
  return (
    <View className="self-start rounded-lg border border-success/60 bg-success-soft/80 px-3 py-1">
      <Text className="text-xs font-bold uppercase tracking-widest text-success">{label}</Text>
    </View>
  );
}
