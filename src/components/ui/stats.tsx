import { Fragment } from 'react';
import { Text, View } from 'react-native';

export interface StatItem {
  label: string;
  value: string;
  valueClassName?: string;
}

interface StatTileProps {
  label: string;
  value: string;
  valueClassName?: string;
}

export function StatTile({ label, value, valueClassName = 'text-content' }: StatTileProps): React.JSX.Element {
  return (
    <View className="flex-1 items-center gap-1">
      <Text className={`text-2xl font-extrabold ${valueClassName}`}>{value}</Text>
      <Text className="text-center text-xs text-content-muted">{label}</Text>
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
          <StatTile label={item.label} value={item.value} valueClassName={item.valueClassName} />
        </Fragment>
      ))}
    </View>
  );
}
