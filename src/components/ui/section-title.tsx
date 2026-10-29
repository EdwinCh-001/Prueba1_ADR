import { Text, View } from 'react-native';

interface SectionTitleProps {
  children: string;
  className?: string;
  showIcon?: boolean;
}

export function SectionTitle({ children, className = '', showIcon = false }: SectionTitleProps): React.JSX.Element {
  return (
    <View className="flex-row items-center gap-2">
      {showIcon ? <Text className="text-base font-bold text-accent-red">◆</Text> : null}
      <Text className={`text-sm font-semibold text-content-muted ${className}`}>{children}</Text>
    </View>
  );
}
