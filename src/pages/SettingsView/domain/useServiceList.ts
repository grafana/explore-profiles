import { QuerierService } from '@shared/pyroscope-api/querier/v1/querier_pb';
import { useQuery } from '@connectrpc/connect-query';
import { useEffect, useMemo, useState } from 'react';

export function useServiceList() {
  const now = useMemo(() => Date.now(), []);

  const { isFetching, error, data } = useQuery(QuerierService.method.labelValues, {
    name: 'service_name',
    start: BigInt(now - 3600 * 1000),
    end: BigInt(now),
  });

  const [serviceNames, setServiceNames] = useState<string[]>([]);

  useEffect(() => {
    if (data) {
      setServiceNames(data?.names ?? []);
    }
  }, [data]);

  return {
    isFetching,
    error: error,
    serviceNames: serviceNames,
  };
}
