import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';
import { userStorage } from '@shared/infrastructure/userStorage';

import { getDefaultProfile, getDefaultServiceAndProfile } from './getDefaultServiceAndProfile';
import { buildQuery } from './parseQuery';
import { useTimeRangeFromUrl } from './useTimeRangeFromUrl';
import { useUrlSearchParams } from './useUrlSearchParams';

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

export function useQueryFromUrl(): [string, (newQuery: string) => void] {
  const { searchParams, pushNewUrl } = useUrlSearchParams();
  const query = searchParams.get('query') ?? '';

  const setQuery = (newQuery: string) => {
    pushNewUrl({ query: newQuery });
  };

  useSetDefaultQuery(Boolean(query), setQuery);

  return [query, setQuery];
}
