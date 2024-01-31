import { SelectableValue } from '@grafana/data';
import { useContext, useMemo } from 'react';

import { PyroscopeStateContext } from '../../../../app/domain/PyroscopeState/context';
import { userStorage } from '../../../infrastructure/userStorage';
import { Services } from '../infrastructure/useFetchServices';

export function useBuildServiceNameOptions(services: Services) {
  const { selectedServiceName, setSelectedServiceName } = useContext(PyroscopeStateContext);

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
    selectedServiceName,
    selectServiceName(selection: SelectableValue<string>) {
      const serviceName = selection.value || '';
      setSelectedServiceName(serviceName);
      userStorage.set(userStorage.KEYS.SETTINGS, { defaultApp: serviceName }).catch(() => {}); // fire & forget
    },
  };
}
