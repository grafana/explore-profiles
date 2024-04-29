import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';
import { userStorage } from '@shared/infrastructure/userStorage';

import { getDefaultProfile, getDefaultServiceAndProfile } from './getDefaultServiceAndProfile';
import { buildQuery } from './parseQuery';
import { useTimeRangeFromUrl } from './useTimeRangeFromUrl';
import { useUrlSearchParams } from './useUrlSearchParams';

type TargetTimeline = 'main' | 'left' | 'right';

const PARAM_NAMES = new Map<TargetTimeline, string>([
  ['main', 'query'],
  ['left', 'leftQuery'],
  ['right', 'rightQuery'],
]);

function useSetDefaultQuery(hasQuery: boolean, setQuery: (newQuery: string) => void) {
  const [timeRange] = useTimeRangeFromUrl();
  const { services } = useFetchServices({ timeRange, enabled: !hasQuery });

  if (hasQuery || !services.size) {
    return;
  }

  const serviceIdFromUserSettings = !hasQuery ? userStorage.get(userStorage.KEYS.SETTINGS)?.defaultApp : '';

  if (serviceIdFromUserSettings && services.has(serviceIdFromUserSettings)) {
    const profileMetricId = getDefaultProfile(serviceIdFromUserSettings, services);

    if (profileMetricId) {
      setQuery(buildQuery({ serviceId: serviceIdFromUserSettings, profileMetricId }));
      return;
    }
  }

  const [serviceId, profileMetricId] = getDefaultServiceAndProfile(services);

  setQuery(buildQuery({ serviceId, profileMetricId }));
}

function buildHook(targetTimeline: TargetTimeline) {
  const paramName = PARAM_NAMES.get(targetTimeline);
  if (paramName === undefined) {
    throw new TypeError(`Undefined parameter name for "${targetTimeline}" timeline!`);
  }

  return function useQueryFromUrl(): [string, (newQuery: string) => void] {
    const { searchParams, pushNewUrl } = useUrlSearchParams();
    const query = searchParams.get(paramName) ?? '';

    const setQuery = (newQuery: string) => {
      pushNewUrl({ [paramName]: newQuery });
    };

    useSetDefaultQuery(Boolean(query), setQuery);

    return [query, setQuery];
  };
}

export const useQueryFromUrl = buildHook('main');
export const useLeftQueryFromUrl = buildHook('left');
export const useRightQueryFromUrl = buildHook('right');
