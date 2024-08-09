import { DataFrame } from '@grafana/data';

export const getSeriesStatsValue = (series: DataFrame, displayName: string) =>
  series.meta?.stats?.find((s) => s.displayName === displayName)?.value;
