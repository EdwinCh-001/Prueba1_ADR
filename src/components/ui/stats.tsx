import { Fragment } from 'react';
import { Text, View } from 'react-native';

export interface StatItem {
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
}

interface StatTileProps {
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
}

export function StatTile({
  label,
  value,
  valueClassName = 'text-content',
  labelClassName = 'text-content-muted',
}: StatTileProps): React.JSX.Element {
  return (
    <View className="flex-1 items-center gap-1">
      <Text className={`text-2xl font-extrabold ${valueClassName}`}>{value}</Text>
      <Text className={`text-center text-xs ${labelClassName}`}>{label}</Text>
    </View>
  );
}

interface StatsRowProps {
  items: StatItem[];
}

export function StatsRow({ items }: StatsRowProps): React.JSX.Element {
  return (
    <View className="flex-row items-center">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? <View className="h-10 w-px bg-line" /> : null}
          <StatTile
            label={item.label}
            labelClassName={item.labelClassName}
            value={item.value}
            valueClassName={item.valueClassName}
          />
        </Fragment>
      ))}
    </View>
  );
}
