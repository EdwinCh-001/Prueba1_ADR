import { Text as NativeText } from 'react-native';
import type { TextProps } from 'react-native';

export type TextVariant = 'body' | 'subtitle' | 'title';
type FontWeight = 'regular' | 'semibold' | 'bold' | 'extrabold';

const weightClasses: Record<string, FontWeight> = {
  'font-extrabold': 'extrabold',
  'font-bold': 'bold',
  'font-semibold': 'semibold',
};

const fontClasses: Record<TextVariant, Record<FontWeight, string>> = {
  body: {
    regular: 'font-ui-nunito-regular',
    semibold: 'font-ui-nunito-semibold',
    bold: 'font-ui-nunito-bold',
    extrabold: 'font-ui-nunito-extrabold',
  },
  subtitle: {
    regular: 'font-ui-open-sans-regular',
    semibold: 'font-ui-open-sans-semibold',
    bold: 'font-ui-open-sans-bold',
    extrabold: 'font-ui-open-sans-extrabold',
  },
  title: {
    regular: 'font-ui-montserrat-regular',
    semibold: 'font-ui-montserrat-semibold',
    bold: 'font-ui-montserrat-bold',
    extrabold: 'font-ui-montserrat-extrabold',
  },
};

const resolveWeight = (classes: Set<string>): FontWeight => {
  for (const [weightClass, weight] of Object.entries(weightClasses)) {
    if (classes.has(weightClass)) {
      return weight;
    }
  }

  return 'regular';
};

const resolveVariant = (
  variant: TextVariant | undefined,
  classes: Set<string>,
): TextVariant => {
  if (variant) {
    return variant;
  }

  const isHeadingSize = ['text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg']
    .some((sizeClass) => classes.has(sizeClass));
  return isHeadingSize ? 'title' : 'body';
};

const resolveFontFamilyClass = (
  className: string | undefined,
  variant: TextVariant | undefined,
): string => {
  const classes = new Set(className?.split(/\s+/) ?? []);
  const resolvedVariant = resolveVariant(variant, classes);
  const weight = resolveWeight(classes);
  return fontClasses[resolvedVariant][weight];
};

interface UiTextProps extends TextProps {
  className?: string;
  variant?: TextVariant;
}

export function Text({
  className,
  variant,
  ...props
}: UiTextProps): React.JSX.Element {
  return (
    <NativeText
      {...props}
      className={`${resolveFontFamilyClass(className, variant)} ${className ?? ''}`}
    />
  );
}
