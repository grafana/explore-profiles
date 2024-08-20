import { dateTime } from '@grafana/data';
import { SceneTimeRangeState } from '@grafana/scenes';

export function getDefaultTimeRange(): SceneTimeRangeState {
  const now = dateTime();

  return {
    from: 'now-30m',
    to: 'now',
    value: {
      from: dateTime(now).subtract(30, 'minutes'),
      to: now,
      raw: { from: 'now-30m', to: 'now' },
    },
  };
}
