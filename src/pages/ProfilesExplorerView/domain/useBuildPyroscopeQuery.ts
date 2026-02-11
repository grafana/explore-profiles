import { sceneGraph, SceneObject } from '@grafana/scenes';
import { useMemo } from 'react';

import { useHierarchyFiltersSelector } from './useHierarchyFiltersSelector';
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

  const hierarchySelector = useHierarchyFiltersSelector(sceneObject);

  return useMemo(() => {
    // Use hierarchy selector if available, otherwise fall back to service_name
    const labelSelector = hierarchySelector || `service_name="${serviceName}"`;
    return `${profileMetricId}{${labelSelector},${filterExpression}}`;
  }, [filterExpression, profileMetricId, serviceName, hierarchySelector]);
}
