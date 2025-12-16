import { TimeRange } from '@grafana/data';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { queryClient } from '@shared/infrastructure/react-query/queryClient';
import { useQuery } from '@tanstack/react-query';

import { ProfileApiClient } from '../../../infrastructure/profiles/ProfileApiClient';
import { DataSourceProxyClientBuilder } from '../../../infrastructure/series/http/DataSourceProxyClientBuilder';
import { cleanupDotResponse } from './cleanupDotResponse';

export type FetchParams = Array<{
  query: string;
  timeRange: TimeRange;
}>;

const MAX_NODES = 100;

/**
 * React hook to fetch DOT profiles for React components. For one-off calls, use fetchDotProfiles function.
 */
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

/**
 * One-off function to fetch DOT profiles. For React components, prefer using useFetchDotProfiles hook.
 */
export async function fetchDotProfiles(
  isDiff: boolean,
  fetchParams: Array<{
    query: string;
    timeRange: TimeRange;
  }>,
  dataSourceUid: string,
  profileMetricId: string
) {
  const profileApiClient = DataSourceProxyClientBuilder.build(dataSourceUid, ProfileApiClient);

  const { params, error: validationError } = validateFetchParams(isDiff, fetchParams);

  if (validationError) {
    throw validationError;
  }

  const dotProfilesOptions = getFetchDotProfilesOptions(dataSourceUid, params, profileApiClient);
  const data = await queryClient.fetchQuery(dotProfilesOptions);
  const profileType = getProfileMetric(profileMetricId as ProfileMetricId).type;

  return { profiles: data || [], profileType };
}

export function validateFetchParams(isDiff: boolean, fetchParams: FetchParams) {
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

function getFetchDotProfilesOptions(
  dataSourceUid: string,
  fetchParams: Array<{
    query: string;
    timeRange: TimeRange;
  }>,
  profileApiClient: ProfileApiClient
) {
  return {
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
  };
}

function usePerformFetchDotProfiles(dataSourceUid: string, fetchParams: FetchParams) {
  const profileApiClient = DataSourceProxyClientBuilder.build(dataSourceUid, ProfileApiClient);
  let dotProfilesOptions = getFetchDotProfilesOptions(dataSourceUid, fetchParams, profileApiClient);
  const { isFetching, error, data } = useQuery({ ...dotProfilesOptions });

  return {
    isFetching,
    error,
    profiles: data || [],
  };
}
