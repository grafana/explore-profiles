import { useMemo } from 'react';
import PROFILE_METRICS from './profile-metrics.json';

export type ProfileMetricId = keyof typeof PROFILE_METRICS;

export type ProfileMetric = {
  id: ProfileMetricId;
  description: string;
  type: string;
  group: string;
  unit: string; // TODO: enum
};

type QueryResponse<T> = {
  data: T;
  error: null | Error;
  isError: boolean;
  isLoading: boolean;
};

function getProfileMetric(profileMetricId: ProfileMetricId): ProfileMetric {
  if (PROFILE_METRICS[profileMetricId]) {
    return PROFILE_METRICS[profileMetricId] as ProfileMetric;
  }

  const [group = 'unknown', type = 'unknown type'] = profileMetricId.split(':');

  return {
    id: profileMetricId,
    description: `No description available for profile metric "${profileMetricId}"`,
    type,
    group,
    unit: 'number', // TODO: confirm
  };
}

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

export function useGetProfileMetricByIds(profileMetricIds: ProfileMetricId[]): QueryResponse<ProfileMetric[]> {
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
