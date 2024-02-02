import { SelectableValue } from '@grafana/data';
import { useCallback, useMemo } from 'react';

// TODO: move useQueryFromUrl.ts to shared/domain
import { useQueryFromUrl } from '../../../../pages/SingleView/domain/useQueryFromUrl';
import { userStorage } from '../../../infrastructure/userStorage';
import { Services } from '../infrastructure/useFetchServices';
import { useProfileTypeFromQuery } from './useBuildProfileTypeOptions';

export function useServiceFromQuery(): [string, (newService: string) => void] {
  const [query, setQuery] = useQueryFromUrl();
  const [, service = ''] = query.match(/.+\{service_name="(.+)"\}/) || [];

  const setService = useCallback(
    (newService: string) => {
      const newQuery = query.replace(`service_name="${service}"`, `service_name="${newService}"`);
      setQuery(newQuery);
    },
    [query, service, setQuery]
  );

  return [service, setService];
}

export function useBuildServiceNameOptions(services: Services) {
  const [selectedService, setService] = useServiceFromQuery();
  const [, setProfileType] = useProfileTypeFromQuery();

  const serviceNameOptions: Array<SelectableValue<string>> = useMemo(
    () =>
      Array.from(services.keys() || [])
        .sort()
        .map((name) => ({
          value: name,
          label: name,
          icon: 'sitemap',
        })),
    [services]
  );

  return {
    serviceNameOptions,
    selectedService: selectedService || serviceNameOptions[0]?.value,
    setService(option: SelectableValue<string>) {
      const newService = option.value || '';
      setService(newService);

      const newProfileTypes = Array.from(services.get(newService)?.values() || []);
      setProfileType(newProfileTypes[0].id);

      userStorage.set(userStorage.KEYS.SETTINGS, { defaultApp: newService }).catch(() => {}); // fire & forget
    },
  };
}
