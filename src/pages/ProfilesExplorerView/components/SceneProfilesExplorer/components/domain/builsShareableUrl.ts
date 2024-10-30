import { dateMath } from '@grafana/data';

import { getDefaultTimeRange } from '../../../..//domain/buildTimeRange';

export function builsShareableUrl(): URL {
  const shareableUrl = new URL(window.location.toString());
  const { searchParams } = shareableUrl;

  if (!searchParams.get('from')) {
    searchParams.set('from', getDefaultTimeRange().from);
  }
  if (!searchParams.get('to')) {
    searchParams.set('to', getDefaultTimeRange().to);
  }

  ['from', 'to', 'from-2', 'to-2', 'from-3', 'to-3', 'diffFrom', 'diffTo', 'diffFrom-2', 'diffTo-2'].forEach((name) => {
    const value = searchParams.get(name);
    if (value) {
      searchParams.set(name, String(dateMath.parse(value)!.valueOf()));
    }
  });

  return shareableUrl;
}
