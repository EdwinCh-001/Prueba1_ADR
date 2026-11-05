import LottieView, { type LottieViewProps } from 'lottie-react-native';
import { View } from 'react-native';

interface LottieStateProps {
  source: LottieViewProps['source'];
  loop: boolean;
  autoPlay: boolean;
  sizeClassName: string;
  accessibilityLabel: string;
}

export function LottieState({
  source,
  loop,
  autoPlay,
  sizeClassName,
  accessibilityLabel,
}: LottieStateProps): React.JSX.Element {
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      className={sizeClassName}
    >
      {/* LottieView requires style for its native size; the wrapper keeps Uniwind styling. */}
      <LottieView
        autoPlay={autoPlay}
        loop={loop}
        source={source}
        style={{ flex: 1 }}
      />
    </View>
  );
}
