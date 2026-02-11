import { AdHocVariableFilter } from '@grafana/data';
import { sceneGraph, SceneObject } from '@grafana/scenes';
import { clone, defaults, uniqBy } from 'lodash';

import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/types/GridItemData';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { getExplorationType } from './getExplorationType';

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

  const interpolatedParams = defaults(clone(queryRunnerParams), {
    serviceName: getSceneVariableValue(sceneObject, 'serviceName'),
    profileMetricId: getSceneVariableValue(sceneObject, 'profileMetricId'),
  });

  // Use filters-all for the all-services view so var-filters is never read there
  const filtersVariableName = getExplorationType(sceneObject) === 'all' ? 'filters-all' : 'filters';
  // state.filters has the AdHocFilterWithLabels[] type so we get rid of keyLabel and valueLabel
  const parsedFilters = (sceneGraph.lookupVariable(filtersVariableName, sceneObject) as FiltersVariable).state.filters.map(
    ({ key, operator, value }) => ({ key, operator, value })
  );

  interpolatedParams.filters = uniqBy(
    [...(interpolatedParams.filters || []), ...parsedFilters],
    ({ key, operator, value }) => `${key}${operator}${value}`
  );

  return interpolatedParams as InterpolatedQueryRunnerParams;
}
