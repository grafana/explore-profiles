import { AdHocVariableFilter } from '@grafana/data';
import { CompleteFilter, OperatorKind } from '@shared/components/QueryBuilder/domain/types';

import { FiltersVariable } from './FiltersVariable';

export const convertPyroscopeToVariableFilter = (filter: CompleteFilter): AdHocVariableFilter => {
  let newOperator = filter.operator.value;

  if (filter.operator.value === OperatorKind['in']) {
    newOperator = OperatorKind['=~'];
  } else if (filter.operator.value === OperatorKind['not-in']) {
    newOperator = OperatorKind['!~'];
  }

  return {
    key: filter.attribute.value,
    operator: newOperator,
    value: filter.value.value,
  };
};

export const addFilter = (model: FiltersVariable, filter: AdHocVariableFilter) => {
  const found = model.state.filters.find((f) => f.key === filter.key);

  if (found) {
    found.value = filter.value;
    model.setState({ filters: [...model.state.filters] });
    return;
  }

  model.setState({ filters: [...model.state.filters, filter] });
};
