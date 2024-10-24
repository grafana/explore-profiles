import { dateTimeParse } from '@grafana/data';
import { SceneTimeRangeState } from '@grafana/scenes';

export function buildTimeRange(from: string, to: string): SceneTimeRangeState {
  return {
    from,
    to,
    value: {
      from: dateTimeParse(from),
      to: dateTimeParse(to),
      raw: { from, to },
    },
  };
}

export const getDefaultTimeRange = () => buildTimeRange('now-30m', 'now');
