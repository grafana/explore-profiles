import { TimeRange } from '@grafana/data';
import { useQuery } from '@tanstack/react-query';

import { DataSourceProxyClientBuilder } from '../../../infrastructure/series/http/DataSourceProxyClientBuilder';
import { cleanupDotResponse } from './cleanupDotResponse';
import { ProfileApiClient } from './ProfileApiClient';

export type FetchParams = Array<{
  query: string;
  timeRange: TimeRange;
}>;

const MAX_NODES = 100;

export function useFetchDotProfiles(dataSourceUid: string, fetchParams: FetchParams) {
  const profileApiClient = DataSourceProxyClientBuilder.build(dataSourceUid, ProfileApiClient) as ProfileApiClient;

  const { isFetching, error, data } = useQuery({
    queryKey: [
      'dot-profiles',
      dataSourceUid,
      ...fetchParams.flatMap(({ query, timeRange }) => [query, timeRange.from.unix(), timeRange.to.unix()]),
      MAX_NODES,
    ],
    queryFn: () => {
      // TODO: pass a signal options to properly abort all in-flight requests
      return Promise.all(
        fetchParams.map(({ query, timeRange }) =>
          profileApiClient.get({ query, timeRange, format: 'dot', maxNodes: MAX_NODES }).then(cleanupDotResponse)
        )
      );
    },
  });

  return {
    isFetching,
    error,
    profiles: data || [],
  };
}
