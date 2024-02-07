import { SelectableValue } from '@grafana/data';
import { buildQuery, parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import { userStorage } from '@shared/infrastructure/userStorage';
import { useMemo } from 'react';

export function useBuildServiceNameOptions(services: Services) {
  const [query, setQuery] = useQueryFromUrl();
  const { service } = parseQuery(query);

  const serviceOptions: Array<SelectableValue<string>> = useMemo(
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
    serviceOptions,
    selectedService: serviceOptions.length ? service : null,
    setService(option: SelectableValue<string>) {
      const newService = option.value || '';

      const newProfileTypes = Array.from(services.get(newService)?.values() || []);
      const newProfileType = newProfileTypes[0].id;

      setQuery(buildQuery({ service: newService, profileType: newProfileType }));

      userStorage.set(userStorage.KEYS.SETTINGS, { defaultApp: newService });
    },
  };
}
