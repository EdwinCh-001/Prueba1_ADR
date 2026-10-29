import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export const StyledSafeAreaView = withUniwind(SafeAreaView);

export const inputClassName =
  'h-14 rounded-2xl border border-line bg-field px-4 text-base text-content focus:border-brand-light';

interface ScreenProps extends React.PropsWithChildren {
  contentContainerClassName?: string;
}

export function Screen({
  children,
  contentContainerClassName = '',
}: ScreenProps): React.JSX.Element {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName={`px-5 pt-6 pb-10 gap-5 ${contentContainerClassName}`}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
