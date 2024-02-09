import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';
import { userStorage } from '@shared/infrastructure/userStorage';
import { useEffect, useState } from 'react';

import { getDefaultProfileType, getDefaultServiceAndProfileType } from './getDefaultServiceAndProfileType';
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

// eslint-disable-next-line sonarjs/cognitive-complexity
function useSetDefaultQuery(): string {
  let query = parseUrlSearchParams().get('query') ?? '';
  const hasQuery = Boolean(query);

  const [timeRange] = useTimeRangeFromUrl();
  const { services, isFetching: isFetchingServices } = useFetchServices({ timeRange, enabled: !hasQuery });

  if (hasQuery || isFetchingServices) {
    return query;
  }

  const serviceFromUserSettings = !hasQuery ? userStorage.get(userStorage.KEYS.SETTINGS)?.defaultApp : '';

  if (serviceFromUserSettings && services.has(serviceFromUserSettings)) {
    const profileType = getDefaultProfileType(serviceFromUserSettings, services);

    if (profileType) {
      query = buildQuery({ service: serviceFromUserSettings, profileType });

      setQuery(query);

      return query;
    }
  }

  const [service, profileType] = getDefaultServiceAndProfileType(services);

  query = buildQuery({ service, profileType });

  setQuery(query);

  return query;
}

export function useQueryFromUrl(): [string, (newQuery: string) => void] {
  const defaultQuery = useSetDefaultQuery();
  const [query, setInternalQuery] = useState(defaultQuery);

  useEffect(() => {
    const onHistoryChange = () => {
      const searchParams = parseUrlSearchParams();
      const newQuery = searchParams.get('query') ?? '';

      setInternalQuery(newQuery);
    };

    window.addEventListener('pushstate', onHistoryChange);
    window.addEventListener('popstate', onHistoryChange);

    return () => {
      window.removeEventListener('popstate', onHistoryChange);
      window.removeEventListener('pushstate', onHistoryChange);
    };
  }, []);

  return [query, setQuery];
}
