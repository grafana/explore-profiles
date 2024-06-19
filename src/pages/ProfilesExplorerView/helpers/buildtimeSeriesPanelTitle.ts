import { sceneGraph, SceneObject } from '@grafana/scenes';

import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';

export function buildtimeSeriesPanelTitle(sceneObject: SceneObject) {
  const serviceName = sceneGraph.lookupVariable('serviceName', sceneObject)?.getValue() as string;
  const profileMetricId = sceneGraph.lookupVariable('profileMetricId', sceneObject)?.getValue() as string;

  return `${serviceName} · ${ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId)}`;
}
