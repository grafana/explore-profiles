import { sceneGraph, SceneObject } from '@grafana/scenes';
import { useMemo } from 'react';

import { HierarchyFilter } from '../infrastructure/timeseries/TimeSeriesQueryRunnerParams';
import { GroupByLabelValueVariable } from './variables/GroupByVariable/GroupByLabelValueVariable';

const MAX_HIERARCHY_LEVELS = 10;

/**
 * Gets hierarchy filters as an array of HierarchyFilter objects
 * Can be used both in React components and outside of them
 */
export function getHierarchyFiltersFromScene(sceneObject: SceneObject): HierarchyFilter[] {
  const filters: HierarchyFilter[] = [];

  for (let i = 0; i < MAX_HIERARCHY_LEVELS; i++) {
    try {
      const hierarchyVar = sceneGraph.findByKeyAndType(
        sceneObject,
        `groupByLabelValue-${i}`,
        GroupByLabelValueVariable
      );
      const value = hierarchyVar.state.value;
      if (value && value !== '') {
        filters.push({
          label: hierarchyVar.getLabelName(),
          value: value as string,
        });
      }
    } catch {
      // Variable not found, stop looking
      break;
    }
  }

  return filters;
}

/**
 * Returns a selector string from the hierarchy variables (e.g., 'cluster="prod",namespace="api"')
 * Returns null if no hierarchy variables are found, indicating to fall back to service_name
 */
export function useHierarchyFiltersSelector(sceneObject: SceneObject): string | null {
  const hierarchyFilters = useHierarchyFilters(sceneObject);

  return useMemo(() => {
    if (hierarchyFilters.length === 0) {
      return null;
    }
    return hierarchyFilters.map(({ label, value }) => `${label}="${value}"`).join(',');
  }, [hierarchyFilters]);
}

/**
 * React hook that returns an array of hierarchy filters from the scene's GroupByLabelValueVariable instances
 */
export function useHierarchyFilters(sceneObject: SceneObject): HierarchyFilter[] {
  return getHierarchyFiltersFromScene(sceneObject);
}
