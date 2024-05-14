import { getDefaultProfile } from '@shared/domain/url-params/getDefaultServiceAndProfile';
import { buildQuery, parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import { userStorage } from '@shared/infrastructure/userStorage';
import { useMemo } from 'react';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function useBuildServiceNameOptions(services: Services) {
  const [query, setQuery] = useQueryFromUrl();
  const { serviceId } = parseQuery(query);

  const serviceOptions = useMemo(() => {
    const cascaderServiceOptions = new Map();

    for (const serviceId of Array.from(services.keys() || []).sort()) {
      const [namespaceOrService, service] = (serviceId as string).split('/');

      if (!service) {
        cascaderServiceOptions.set(namespaceOrService, {
          value: serviceId,
          label: serviceId,
        });
      } else {
        const nameSpaceServices = cascaderServiceOptions.get(namespaceOrService) || {
          value: namespaceOrService,
          label: namespaceOrService,
          items: [],
        };

        const items = nameSpaceServices.items || [];

        items.push({
          value: serviceId,
          label: service,
        });

        nameSpaceServices.items = items;

        cascaderServiceOptions.set(namespaceOrService, nameSpaceServices);
      }
    }

    return Array.from(cascaderServiceOptions.values());
  }, [services]);

  return {
    serviceOptions,
    selectedServiceId: serviceOptions.length ? serviceId : undefined,
    selectService(newServiceId: string) {
      const newProfileMetricId =
        getDefaultProfile(newServiceId, services) || Array.from(services.get(newServiceId)?.values() || [])[0]?.id;

      setQuery(buildQuery({ serviceId: newServiceId, profileMetricId: newProfileMetricId }));

      userStorage.set(userStorage.KEYS.SETTINGS, { defaultApp: newServiceId });
    },
  };
}
