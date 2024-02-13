import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';
import { userStorage } from '@shared/infrastructure/userStorage';
import { useEffect, useState } from 'react';

import { getDefaultProfile, getDefaultServiceAndProfile } from './getDefaultServiceAndProfile';
import { buildQuery } from './parseQuery';
import { parseUrlSearchParams } from './parseUrlSearchParams';
import { pushNewUrl } from './pushNewUrl';
import { useTimeRangeFromUrl } from './useTimeRangeFromUrl';

const setQuery = (newQuery: string) => {
  const searchParams = parseUrlSearchParams();

  if (searchParams.get('query') !== newQuery) {
    searchParams.set('query', newQuery);

    pushNewUrl(searchParams);
  }
};

function useSetDefaultQuery(): string {
  let query = parseUrlSearchParams().get('query') ?? '';
  const hasQuery = Boolean(query);

  const [timeRange] = useTimeRangeFromUrl();
  const { services } = useFetchServices({ timeRange, enabled: !hasQuery });

  if (hasQuery || !services.size) {
    return query;
  }

  const serviceIdFromUserSettings = !hasQuery ? userStorage.get(userStorage.KEYS.SETTINGS)?.defaultApp : '';

  if (serviceIdFromUserSettings && services.has(serviceIdFromUserSettings)) {
    const profileMetricId = getDefaultProfile(serviceIdFromUserSettings, services);

    if (profileMetricId) {
      query = buildQuery({ serviceId: serviceIdFromUserSettings, profileMetricId });

      setQuery(query);

      return query;
    }
  }

  const [serviceId, profileMetricId] = getDefaultServiceAndProfile(services);

  query = buildQuery({ serviceId, profileMetricId });

  setQuery(query);

  return query;
}

export function useQueryFromUrl(): [string, (newQuery: string) => void] {
  const defaultQuery = useSetDefaultQuery();
  const [query, setInternalQuery] = useState(defaultQuery);

  useEffect(() => {
    const onHistoryChange = () => {
      const newQuery = parseUrlSearchParams().get('query');

      if (newQuery !== query) {
        setInternalQuery(newQuery ?? '');
      }
    };

    window.addEventListener('pushstate', onHistoryChange);
    window.addEventListener('popstate', onHistoryChange);

    return () => {
      window.removeEventListener('popstate', onHistoryChange);
      window.removeEventListener('pushstate', onHistoryChange);
    };
  }, [query]);

  return [query, setQuery];
}
