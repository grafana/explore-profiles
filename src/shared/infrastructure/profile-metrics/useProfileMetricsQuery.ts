import { useMemo } from 'react';

import { getProfileMetric, ProfileMetric, ProfileMetricId, ProfileMetrics } from './getProfileMetric';
import PROFILE_METRICS from './profile-metrics.json';

type QueryResponse<T> = {
  data: T;
  error: null | Error;
  isError: boolean;
  isLoading: boolean;
};

// Assumption: in the future we might have an API to fetch this data from...
// So we design these hooks accordingly (it also feels natural from the consumer point of view)
export function useGetProfileMetricById(profileMetricId: ProfileMetricId): QueryResponse<ProfileMetric> {
  const data = useMemo(() => getProfileMetric(profileMetricId), [profileMetricId]);

  return {
    data,
    error: null,
    isError: false,
    isLoading: false,
  };
}

export function useGetProfileMetricByIds(profileMetricIds: ProfileMetricId[]): QueryResponse<ProfileMetrics> {
  const data = useMemo(
    () => profileMetricIds.map((profileMetricId) => getProfileMetric(profileMetricId)),
    [profileMetricIds]
  );

  return {
    data,
    error: null,
    isError: false,
    isLoading: false,
  };
}

export function useGetProfileMetricByType(type?: ProfileMetric['type']): ProfileMetric {
  const data = useMemo(
    () =>
      Object.values(PROFILE_METRICS).reduce((acc, profileMetric) => {
        acc.set(profileMetric.type, profileMetric);
        return acc;
      }, new Map()),
    []
  );

  return data.get(type) || {};
}
