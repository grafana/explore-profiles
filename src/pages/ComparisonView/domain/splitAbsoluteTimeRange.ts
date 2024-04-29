import { TimeRange } from '@grafana/data';
import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';

export function splitAbsoluteTimeRange(timeRange: TimeRange): [TimeRange, TimeRange] {
  const { from, to } = timeRange;
  const halfRange = Math.round((to.unix() - from.unix()) / 2);

  const mid = from.unix() + halfRange;

  return [
    translatePyroscopeTimeRangeToGrafana(String(from.unix()), String(mid)),
    translatePyroscopeTimeRangeToGrafana(String(mid), String(to.unix())),
  ];
}
