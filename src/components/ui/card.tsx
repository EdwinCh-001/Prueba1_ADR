import { View } from 'react-native';

interface CardProps extends React.PropsWithChildren {
  className?: string;
}

export function Card({ children, className = '' }: CardProps): React.JSX.Element {
  return <View className={`rounded-3xl border border-line/90 bg-surface/85 p-5 shadow-sm ${className}`}>{children}</View>;
}
