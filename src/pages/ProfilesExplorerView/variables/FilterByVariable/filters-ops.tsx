import { AdHocVariableFilter } from '@grafana/data';
import { sceneGraph } from '@grafana/scenes';
import { CompleteFilter, OperatorKind } from '@shared/components/QueryBuilder/domain/types';

import { FilterByVariable } from './FilterByVariable';

// we use baseFilters to be able to easily update the query required by QueryBuilder
const buildBaseFilters = (model: FilterByVariable) => [
  {
    key: 'service_name',
    operator: '=',
    value: sceneGraph.lookupVariable('serviceName', model)?.getValue() as string,
  },
  {
    key: 'profile_metric_id',
    operator: '=',
    value: sceneGraph.lookupVariable('profileMetricId', model)?.getValue() as string,
  },
];

// we use filterExpression for the Pryoscope query
const buildFilterExpression = ({
  model,
  baseFilters,
  filters,
}: {
  model: FilterByVariable;
  baseFilters?: AdHocVariableFilter[];
  filters?: AdHocVariableFilter[];
}) => {
  const baseFiltersToUse = (baseFilters || model.state.baseFilters) as AdHocVariableFilter[];
  const filtersToUse = (filters || model.state.filters) as AdHocVariableFilter[];

  const completeFilters = [baseFiltersToUse[0], ...filtersToUse];
  const selector = completeFilters.map(({ key, operator, value }) => `${key}${operator}"${value}"`).join(',');

  return `${baseFiltersToUse[1].value}{${selector}}`;
};

export const updateBaseFilters = (model: FilterByVariable) => {
  const baseFilters = buildBaseFilters(model);

  model.setState({
    baseFilters,
    filterExpression: buildFilterExpression({ model, baseFilters }),
  });
};

export const updateFilters = (model: FilterByVariable, filters: AdHocVariableFilter[]) => {
  model.setState({
    filters,
    filterExpression: buildFilterExpression({ model, filters }),
  });
};

export const addFilter = (model: FilterByVariable, filter: AdHocVariableFilter) => {
  const found = model.state.filters.find((f) => f.key === filter.key);

  if (found) {
    found.value = filter.value;
    updateFilters(model, model.state.filters);
    return;
  }

  updateFilters(model, [...model.state.filters, filter]);
};

export const convertPyroscopeToVariableFilter = (filter: CompleteFilter) => ({
  key: filter.attribute.value,
  operator: filter.operator.value === OperatorKind['is-empty'] ? OperatorKind['='] : filter.operator.value,
  value: filter.value.value,
});
