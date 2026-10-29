import { Text } from 'react-native';

interface SectionTitleProps {
  children: string;
  className?: string;
}

export function SectionTitle({ children, className = '' }: SectionTitleProps): React.JSX.Element {
  return <Text className={`text-sm font-semibold text-content-muted ${className}`}>{children}</Text>;
}
