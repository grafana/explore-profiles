import { AdHocVariableFilter } from '@grafana/data';
import { parseRawFilters } from '@shared/components/QueryBuilder/domain/helpers/queryToFilters';
import { CompleteFilter, OperatorKind } from '@shared/components/QueryBuilder/domain/types';

import { FiltersVariable } from './FiltersVariable';

export const convertPyroscopeToVariableFilter = (filter: CompleteFilter) => ({
  key: filter.attribute.value,
  operator: filter.operator.value === OperatorKind['is-empty'] ? OperatorKind['='] : filter.operator.value,
  value: filter.value.value,
});

export const addFilter = (model: FiltersVariable, filter: AdHocVariableFilter) => {
  const found = model.state.filters.find((f) => f.key === filter.key);

  if (found) {
    found.value = filter.value;
    model.setState({ filters: [...model.state.filters] });
    return;
  }

  model.setState({ filters: [...model.state.filters, filter] });
};

export const expressionBuilder = (serviceName: string, profileMetricId: string, filters: AdHocVariableFilter[]) => {
  if (!serviceName || !profileMetricId) {
    return '';
  }

  const completeFilters = [{ key: 'service_name', operator: '=', value: serviceName }, ...filters];
  const selector = completeFilters.map(({ key, operator, value }) => `${key}${operator}"${value}"`).join(',');

  return `${profileMetricId}{${selector}}`;
};

export const parseVariableValue = (variableValue = '') =>
  !variableValue
    ? []
    : (parseRawFilters(variableValue)
        .map((filterPartsOrNull) => {
          if (!filterPartsOrNull) {
            console.error(`Error while parsing filters variable "${variableValue}"!`);
            return null;
          }

          return { key: filterPartsOrNull[0], operator: filterPartsOrNull[1], value: filterPartsOrNull[2] };
        })
        .filter(Boolean) as AdHocVariableFilter[]);
