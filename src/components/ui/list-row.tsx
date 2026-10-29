import { Pressable, Text, View } from 'react-native';

interface ListRowProps {
  glyph: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  elevated?: boolean;
}

export function ListRow({
  glyph,
  title,
  subtitle,
  onPress,
  elevated = false,
}: ListRowProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className={`flex-row items-center gap-4 rounded-3xl border border-line/90 bg-surface/85 p-4 ${
        elevated ? 'shadow-sm' : ''
      } active:bg-surface-raised`}
      onPress={onPress}
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
        <Text className="text-2xl text-brand-light">{glyph}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-base font-bold text-content">{title}</Text>
        <Text className="text-sm text-success">{subtitle}</Text>
      </View>
      <Text className="text-2xl text-brand-light">›</Text>
    </Pressable>
  );
}
