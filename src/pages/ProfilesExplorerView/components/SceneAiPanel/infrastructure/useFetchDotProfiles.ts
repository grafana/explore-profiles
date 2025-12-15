import { TimeRange } from '@grafana/data';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { useQuery } from '@tanstack/react-query';

import { ProfileApiClient } from '../../../infrastructure/profiles/ProfileApiClient';
import { DataSourceProxyClientBuilder } from '../../../infrastructure/series/http/DataSourceProxyClientBuilder';
import { cleanupDotResponse } from './cleanupDotResponse';

export type FetchParams = Array<{
  query: string;
  timeRange: TimeRange;
}>;

const MAX_NODES = 100;

export function useFetchDotProfiles(
  isDiff: boolean,
  fetchParams: Array<{
    query: string;
    timeRange: TimeRange;
  }>,
  dataSourceUid: string,
  profileMetricId: string
) {
  const { params, error: validationError } = validateFetchParams(isDiff, fetchParams);

  const { error: fetchError, isFetching, profiles } = usePerformFetchDotProfiles(dataSourceUid, params);
  const profileType = getProfileMetric(profileMetricId as ProfileMetricId).type;

  return { profileType, profiles, validationError, fetchError, isFetching };
}

function validateFetchParams(isDiff: boolean, fetchParams: FetchParams) {
  let params = fetchParams;
  let error;

  if (isDiff && fetchParams.length !== 2) {
    error = new Error(`Invalid number of fetch parameters for analyzing the diff flame graph (${fetchParams.length})!`);
    params = [];
  } else if (!isDiff && fetchParams.length !== 1) {
    error = new Error(`Invalid number of fetch parameters for analyzing the flame graph (${fetchParams.length})!`);
    params = [];
  }

  // Validate time ranges - ensure all have non-zero from and to values
  // Sending zero parameter values to the API can cause issues
  const hasInvalidTimeRanges = params.some(({ timeRange }) => {
    return timeRange.from.unix() === 0 || timeRange.to.unix() === 0;
  });

  if (hasInvalidTimeRanges) {
    error = new Error('Invalid time range: from and to values must be non-zero');
    params = [];
  }

  return { params, error };
}

function usePerformFetchDotProfiles(dataSourceUid: string, fetchParams: FetchParams) {
  const profileApiClient = DataSourceProxyClientBuilder.build(dataSourceUid, ProfileApiClient);

  const { isFetching, error, data } = useQuery({
    queryKey: [
      'dot-profiles',
      dataSourceUid,
      ...fetchParams.flatMap(({ query, timeRange }) => [query, timeRange.from.unix(), timeRange.to.unix()]),
      MAX_NODES,
    ],
    enabled: fetchParams.length > 0,
    queryFn: () => {
      // TODO: pass a signal options to properly abort all in-flight requests
      return Promise.all(
        fetchParams.map(({ query, timeRange }) =>
          profileApiClient
            .get({ query, timeRange, format: 'dot', maxNodes: MAX_NODES })
            .then((response) => cleanupDotResponse(response as string))
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
