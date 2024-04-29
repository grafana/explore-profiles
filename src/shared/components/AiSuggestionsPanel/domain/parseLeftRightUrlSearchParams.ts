import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';

// TODO: define custom hooks like useQueryFromUrl() and useTimeRangeFromUrl()
export function parseLeftRightUrlSearchParams() {
  const urlSearchParams = new URLSearchParams(window.location.search);

  const leftQuery = urlSearchParams.get('leftQuery') ?? '';
  const leftTimeRange = translatePyroscopeTimeRangeToGrafana(
    urlSearchParams.get('leftFrom') ?? 'now-1h',
    urlSearchParams.get('leftUntil') ?? 'now-30m'
  );

  const rightQuery = urlSearchParams.get('rightQuery') ?? '';
  const rightTimeRange = translatePyroscopeTimeRangeToGrafana(
    urlSearchParams.get('rightFrom') ?? 'now-30m',
    urlSearchParams.get('rightUntil') ?? 'now'
  );

  return [
    {
      query: leftQuery,
      timeRange: leftTimeRange,
    },
    {
      query: rightQuery,
      timeRange: rightTimeRange,
    },
  ];
}
