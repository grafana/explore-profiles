import PROFILE_METRICS from './profile-metrics.json';

export type ProfileMetricId = keyof typeof PROFILE_METRICS;

export type ProfileMetric = {
  id: ProfileMetricId;
  description: string;
  type: string;
  group: string;
  unit: string; // TODO: enum
};

export type ProfileMetrics = ProfileMetric[];

export function getProfileMetric(profileMetricId: ProfileMetricId): ProfileMetric {
  if (PROFILE_METRICS[profileMetricId]) {
    return PROFILE_METRICS[profileMetricId] as ProfileMetric;
  }

  const [group = 'unknown', type = 'unknown type'] = profileMetricId.split(':');

  const description = `No description available for profile metric "${profileMetricId}"`;
  console.warn(description);

  return {
    id: profileMetricId,
    description,
    type,
    group,
    unit: 'short',
  };
}
