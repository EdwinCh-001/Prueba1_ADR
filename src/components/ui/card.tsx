import { View } from 'react-native';

interface CardProps extends React.PropsWithChildren {
  className?: string;
  variant?: CardVariant;
  elevated?: boolean;
}

export type CardVariant = 'default' | 'highlight' | 'danger' | 'success';

const variantClasses: Record<CardVariant, string> = {
  default: 'border-line/90 bg-surface/85',
  highlight: 'border-warning bg-warning-soft/80',
  danger: 'border-danger bg-danger-soft/80',
  success: 'border-success bg-success-soft/80',
};

export function Card({
  children,
  className = '',
  variant = 'default',
  elevated = false,
}: CardProps): React.JSX.Element {
  return (
    <View className={`rounded-3xl border p-5 ${variantClasses[variant]} ${elevated ? 'shadow-sm' : ''} ${className}`}>
      {children}
    </View>
  );
}
