import PROFILE_METRICS from './profile-metrics.json';

export type ProfileMetricId = keyof typeof PROFILE_METRICS;

export type ProfileMetric = {
  id: ProfileMetricId;
  description: string;
  type: string;
  group: string;
  unit: string; // TODO: enum
};

export function getProfileMetric(profileMetricId: ProfileMetricId): ProfileMetric {
  if (PROFILE_METRICS[profileMetricId]) {
    return PROFILE_METRICS[profileMetricId] as ProfileMetric;
  }

  const [group = '?', type = '?'] = profileMetricId ? profileMetricId.split(':') : [];

  // TODO: add missing metrics (e.g. godeltaprof are not yet defined)
  // logger.warn(`No profile metric found for id "${profileMetricId}"`);

  return {
    id: profileMetricId,
    description: '',
    type,
    group,
    unit: 'short',
  };
}
