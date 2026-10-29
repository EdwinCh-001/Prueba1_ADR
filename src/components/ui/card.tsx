import { View } from 'react-native';

interface CardProps extends React.PropsWithChildren {
  className?: string;
}

export function Card({ children, className = '' }: CardProps): React.JSX.Element {
  return <View className={`rounded-3xl bg-surface p-5 ${className}`}>{children}</View>;
}
