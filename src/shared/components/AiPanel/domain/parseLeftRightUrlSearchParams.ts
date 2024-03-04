import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';
import { parseUrlSearchParams } from '@shared/domain/url-params/parseUrlSearchParams';

// TODO: define custom hooks like useQueryFromUrl() and useTimeRangeFromUrl()
export function parseLeftRightUrlSearchParams() {
  const urlSearchParams = parseUrlSearchParams();

  const leftQuery = urlSearchParams.get('leftQuery') ?? '';
  const leftTimeRange = translatePyroscopeTimeRangeToGrafana(
    urlSearchParams.get('leftFrom') ?? '',
    urlSearchParams.get('leftUntil') ?? ''
  );

  const rightQuery = parseUrlSearchParams().get('rightQuery') ?? '';
  const rightTimeRange = translatePyroscopeTimeRangeToGrafana(
    urlSearchParams.get('rightFrom') ?? '',
    urlSearchParams.get('rightUntil') ?? ''
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
