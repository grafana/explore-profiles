import { AdHocVariableFilter } from '@grafana/data';
import { sceneGraph, SceneObject } from '@grafana/scenes';
import { clone, uniqBy } from 'lodash';

import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/GridItemData';
import { FiltersVariable } from '../../variables/FiltersVariable/FiltersVariable';

type InterpolatedQueryRunnerParams = GridItemData['queryRunnerParams'] & {
  serviceName: string;
  profileMetricId: string;
  filters: AdHocVariableFilter[];
};

export function interpolateQueryRunnerVariables(
  sceneObject: SceneObject,
  item: GridItemData
): InterpolatedQueryRunnerParams {
  const { queryRunnerParams } = item;

  const interpolatedParams = clone(queryRunnerParams);

  interpolatedParams.serviceName = sceneGraph.lookupVariable('serviceName', sceneObject)?.getValue() as string;
  interpolatedParams.profileMetricId = sceneGraph.lookupVariable('profileMetricId', sceneObject)?.getValue() as string;

  // state.filters has the AdHocFilterWithLabels[] type so we get rid of keyLabel and valueLabel
  const parsedFilters = (sceneGraph.lookupVariable('filters', sceneObject) as FiltersVariable).state.filters.map(
    ({ key, operator, value }) => ({ key, operator, value })
  );

  interpolatedParams.filters = uniqBy(
    [...(interpolatedParams.filters || []), ...parsedFilters],
    ({ key, operator, value }) => `${key}${operator}${value}`
  );

  return interpolatedParams as InterpolatedQueryRunnerParams;
}
