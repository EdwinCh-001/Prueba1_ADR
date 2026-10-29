import { Image, View } from 'react-native';

interface LogoPlateProps {
  size?: 'sm' | 'lg';
  align?: 'start' | 'center';
  className?: string;
  tone?: 'default' | 'white';
}

const imageSizes: Record<NonNullable<LogoPlateProps['size']>, string> = {
  sm: 'h-14 w-28',
  lg: 'h-32 w-64',
};

const alignClasses: Record<NonNullable<LogoPlateProps['align']>, string> = {
  start: 'self-start',
  center: 'self-center',
};

export function LogoPlate({
  size = 'sm',
  align = 'start',
  className = '',
  tone = 'default',
}: LogoPlateProps): React.JSX.Element {
  return (
    <Image
      accessibilityLabel="Logo institucional"
      className={`${alignClasses[align]} ${imageSizes[size]} ${className}`}
      resizeMode="contain"
      source={require('../../../assets/Logo.png')}
      tintColor={tone === 'white' ? '#FFFFFF' : undefined}
    />
  );
}

export function AccentBar({ className = '' }: { className?: string }): React.JSX.Element {
  return (
    <View className={`h-1 flex-row overflow-hidden rounded-full ${className}`}>
      <View className="w-1/5 bg-accent-red" />
      <View className="flex-1 bg-brand" />
    </View>
  );
}
