import { CascaderOption } from '@grafana/ui';
import { getDefaultProfile } from '@shared/domain/url-params/getDefaultServiceAndProfile';
import { buildQuery, parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import { userStorage } from '@shared/infrastructure/userStorage';
import { useMemo } from 'react';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function buildServiceNameCascaderOptions(serviceNames: string[]) {
  const options: CascaderOption[] = [];

  for (const serviceId of serviceNames) {
    // serviceId = ebpf/agent-logs/agent ; parts = [ebpf,agent-logs,agent]
    const parts = serviceId.split('/');

    let currentPart: string;
    const currentValues = [];
    let currentOptions = options;

    for (let level = 0; level < parts.length; level += 1) {
      currentPart = parts[level];
      currentValues.push(currentPart);
      const value = currentValues.join('/');

      const existingOption = currentOptions.find((o) => o.value === value);

      if (existingOption) {
        currentOptions = existingOption.items as CascaderOption[];
      } else {
        const newOption = {
          value,
          label: currentPart,
          // setting items only for non-terminal nodes is required by the Cascader component
          // without it, the initial value would not be properly set in the UI
          items: level < parts.length - 1 ? [] : undefined,
        };

        currentOptions.push(newOption);
        currentOptions = newOption.items || [];
      }
    }
  }

  return options;
}

export function useBuildServiceNameOptions(services: Services) {
  const [query, setQuery] = useQueryFromUrl();
  const { serviceId } = parseQuery(query);

  const serviceOptions = useMemo(
    () => buildServiceNameCascaderOptions(Array.from(services.keys() || []).sort()),
    [services]
  );

  return {
    servicePlaceHolder: `Choose a service (${serviceOptions.length})`,
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
