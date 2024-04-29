import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';
import { parseUrlSearchParams } from '@shared/domain/url-params/parseUrlSearchParams';

// TODO: define custom hooks like useQueryFromUrl() and useTimeRangeFromUrl()
export function parseLeftRightUrlSearchParams() {
  const urlSearchParams = parseUrlSearchParams();

  const leftQuery = urlSearchParams.get('leftQuery') ?? '';
  const leftTimeRange = translatePyroscopeTimeRangeToGrafana(
    urlSearchParams.get('leftFrom') ?? 'now-1h',
    urlSearchParams.get('leftUntil') ?? 'now-30m'
  );

  const rightQuery = parseUrlSearchParams().get('rightQuery') ?? '';
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
