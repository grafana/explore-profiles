import { QuerierService } from '@shared/pyroscope-api/querier/v1/querier_pb';
import { useQuery } from '@connectrpc/connect-query';
import { CascaderOption } from '@grafana/ui';
import { DomainHookReturnValueTyped } from '@shared/types/DomainHookReturnValue';
import { useEffect, useMemo, useState } from 'react';

import { buildServiceNameCascaderOptions } from '../../../../../../ProfilesExplorerView/domain/variables/ServiceNameVariable/domain/useBuildServiceNameOptions';
import { AddServiceProps } from '../AddService';

export function useAddService({ onServiceAdd, existingServiceNames }: AddServiceProps): DomainHookReturnValueTyped<
  {
    isFetching: boolean;
    error: Error | null;
    cascaderOptions: CascaderOption[];
  },
  {
    addAllServices(): void;
    addService(serviceName: string): void;
  }
> {
  const now = useMemo(() => Date.now(), []);

  const { isFetching, error, data } = useQuery(QuerierService.method.labelValues, {
    name: 'service_name',
    start: BigInt(now - 3600 * 1000),
    end: BigInt(now),
  });

  const [serviceNames, setServiceNames] = useState<string[]>([]);

  const cascaderOptions = useMemo(
    () => buildServiceNameCascaderOptions(serviceNames.filter((n) => !existingServiceNames.includes(n))),
    [serviceNames, existingServiceNames]
  );

  useEffect(() => {
    if (data) {
      setServiceNames(data?.names ?? []);
    }
  }, [data]);

  return {
    data: {
      isFetching,
      error,
      cascaderOptions,
    },
    actions: {
      addAllServices() {
        serviceNames.forEach((serviceName) => {
          onServiceAdd(serviceName, true);
        });
      },
      addService(serviceName: string) {
        onServiceAdd(serviceName, true);
      },
    },
  };
}
