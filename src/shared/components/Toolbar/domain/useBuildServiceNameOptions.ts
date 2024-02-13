import { SelectableValue } from '@grafana/data';
import { getDefaultProfile } from '@shared/domain/url-params/getDefaultServiceAndProfile';
import { buildQuery, parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import { userStorage } from '@shared/infrastructure/userStorage';
import { useMemo } from 'react';

export function useBuildServiceNameOptions(services: Services) {
  const [query, setQuery] = useQueryFromUrl();
  const { serviceId } = parseQuery(query);

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
    selectedServiceId: serviceOptions.length ? serviceId : null,
    selectService(option: SelectableValue<string>) {
      const newServiceId = option.value || '';

      const newProfileMetricId =
        getDefaultProfile(newServiceId, services) || Array.from(services.get(newServiceId)?.values() || [])[0]?.id;

      setQuery(buildQuery({ serviceId: newServiceId, profileMetricId: newProfileMetricId }));

      userStorage.set(userStorage.KEYS.SETTINGS, { defaultApp: newServiceId });
    },
  };
}
