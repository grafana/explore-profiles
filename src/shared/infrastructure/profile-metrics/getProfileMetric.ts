import PROFILE_METRICS from './profile-metrics.json';

const PROFILE_METRICS_BY_TYPE: Map<string, ProfileMetric> = Object.values(PROFILE_METRICS).reduce(
  (acc, profileMetric) => {
    acc.set(profileMetric.type, profileMetric);
    return acc;
  },
  new Map()
);

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

  const [group = '?', type = '?'] = profileMetricId ? profileMetricId.split(':') : [];

  // TODO: add missing metrics (e.g. godeltaprof are not yet defined)
  // console.warn(`No profile metric found for id "${profileMetricId}"`);

  return {
    id: profileMetricId,
    description: '',
    type,
    group,
    unit: 'short',
  };
}

export function getProfileMetricByType(type: string): ProfileMetric {
  if (PROFILE_METRICS_BY_TYPE.has(type)) {
    return PROFILE_METRICS_BY_TYPE.get(type) as ProfileMetric;
  }

  // TODO: add missing metrics (e.g. godeltaprof are not yet defined)
  // console.warn(`No profile metric found for type "${type}"`);

  return {
    id: 'unknown id' as ProfileMetricId,
    description: '',
    type,
    group: 'unknown',
    unit: 'short',
  };
}
