import { sceneGraph, SceneObject } from '@grafana/scenes';
import { useMemo } from 'react';

import { SceneProfilesExplorer, ExplorationType } from '../components/SceneProfilesExplorer/SceneProfilesExplorer';
import { FiltersVariable } from './variables/FiltersVariable/FiltersVariable';
import { ProfileMetricVariable } from './variables/ProfileMetricVariable';
import { ServiceNameVariable } from './variables/ServiceNameVariable/ServiceNameVariable';

export function useBuildPyroscopeQuery(sceneObject: SceneObject, filterKey: string) {
  const { value: serviceName } = sceneGraph
    .findByKeyAndType(sceneObject, 'serviceName', ServiceNameVariable)
    .useState();

  const { value: profileMetricId } = sceneGraph
    .findByKeyAndType(sceneObject, 'profileMetricId', ProfileMetricVariable)
    .useState();

  const { filterExpression } = sceneGraph.findByKeyAndType(sceneObject, filterKey, FiltersVariable).useState();

  // Get the current exploration type to determine if we should include service_name
  const { explorationType } = sceneGraph
    .findByKeyAndType(sceneObject, 'profiles-explorer', SceneProfilesExplorer)
    .useState();

  // Only include service_name filter for views that have a single service selected
  // For "all", "profiles", and "favorites" views, we want to query across all services
  const shouldIncludeServiceName =
    explorationType === ExplorationType.LABELS ||
    explorationType === ExplorationType.FLAME_GRAPH ||
    explorationType === ExplorationType.DIFF_FLAME_GRAPH;

  return useMemo(() => {
    if (shouldIncludeServiceName && serviceName) {
      const labels = `{service_name="${serviceName}",${filterExpression}}`;
      return profileMetricId != null && profileMetricId !== '' ? `${profileMetricId}${labels}` : labels;
    }
    // For "all" and "profiles" views, don't constrain to a single service
    if (profileMetricId != null && profileMetricId !== '') {
      return filterExpression ? `${profileMetricId}{${filterExpression}}` : `${profileMetricId}{}`;
    }
    return filterExpression ? `{${filterExpression}}` : `{}`;
  }, [filterExpression, profileMetricId, serviceName, shouldIncludeServiceName]);
}
