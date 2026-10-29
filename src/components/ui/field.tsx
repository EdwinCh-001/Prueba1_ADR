import { Text, View } from 'react-native';

interface FieldProps extends React.PropsWithChildren {
  label: string;
  error?: string;
}

export function Field({ label, error, children }: FieldProps): React.JSX.Element {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-content-muted">{label}</Text>
      {children}
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
