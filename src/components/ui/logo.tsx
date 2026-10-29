import { Image, View } from 'react-native';

interface LogoPlateProps {
  size?: 'sm' | 'lg';
  align?: 'start' | 'center';
  className?: string;
}

const imageSizes: Record<NonNullable<LogoPlateProps['size']>, string> = {
  sm: 'h-9 w-20',
  lg: 'h-14 w-28',
};

const plateSizes: Record<NonNullable<LogoPlateProps['size']>, string> = {
  sm: 'px-2 py-1 rounded-xl',
  lg: 'px-4 py-3 rounded-2xl',
};

const alignClasses: Record<NonNullable<LogoPlateProps['align']>, string> = {
  start: 'self-start',
  center: 'self-center',
};

export function LogoPlate({
  size = 'sm',
  align = 'start',
  className = '',
}: LogoPlateProps): React.JSX.Element {
  return (
    <View className={`${alignClasses[align]} bg-white ${plateSizes[size]} ${className}`}>
      <Image
        accessibilityLabel="Logo de EPMAPS Agua de Quito"
        resizeMode="contain"
        source={require('../../../assets/Logo.jpg')}
        className={imageSizes[size]}
      />
    </View>
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
