import { AdHocVariableFilter } from '@grafana/data';
import { parseRawFilters, REGEX_CHARS_REGEX } from '@shared/components/QueryBuilder/domain/helpers/queryToFilters';
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

const includeExcludeValue = (
  operator: string,
  model: FiltersVariable,
  filter: AdHocVariableFilter
): { done: boolean; found?: AdHocVariableFilter } => {
  const found = model.state.filters.find((f) => f.key === filter.key);

  if (!found) {
    // create a new filter
    const newFilter = { ...filter, operator: operator }; // will be translated to an "in"/"not in" operator in the UI
    model.setState({
      filters: [...model.state.filters, newFilter],
    });
    return { done: true };
  }

  // is there already a filter with either a regex or an "in"/"not in" operator?
  if (found.operator !== operator) {
    return { done: false, found };
  }

  // is it a filter with a regex?
  if (REGEX_CHARS_REGEX.test(found.value)) {
    // yes, we replace it by a new filter with an "in"/"not in" operator and the single filter value
    const newFilter = { ...found, value: filter.value };
    model.setState({
      filters: [...model.state.filters.filter((f) => f.key !== filter.key), newFilter],
    });
    return { done: true };
  }

  // we're handling a filter with an "in"/"not in" operator
  const values = found.value.split('|');

  // does it already include the new value?
  if (!values.includes(filter.value)) {
    // no, we include it
    const newFilter = { ...found, value: [...values, filter.value].join('|') };
    model.setState({
      filters: [...model.state.filters.filter((f) => f.key !== filter.key), newFilter],
    });
    return { done: true };
  }

  return { done: true };
};

export const includeInFilter = (model: FiltersVariable, filter: AdHocVariableFilter) => {
  const { done, found } = includeExcludeValue('=~', model, filter);
  if (done || !found) {
    return;
  }

  // we're handling a filter with a regex or a "not in" operator

  // is it a filter with a regex?
  if (REGEX_CHARS_REGEX.test(found.value)) {
    // we replace the existing filter with a new filter
    const newFilter = { ...found, operator: '=~', value: filter.value };
    model.setState({
      filters: [...model.state.filters.filter((f) => f.key !== filter.key), newFilter],
    });
    return;
  }

  // we're handling a filter with an "not in" operator
  let values = found.value.split('|');

  // does it already contain the value to include?
  if (!values.includes(filter.value)) {
    // no, nothing to do
    return;
  }

  // yes, we remove it from the filter values
  values = values.filter((v) => v !== filter.value);

  if (!values.length) {
    // we remove the existing filter
    model.setState({
      filters: [...model.state.filters.filter((f) => f.key !== filter.key)],
    });
    return;
  }

  // we remove the value from the existing filter
  const newFilter = { ...found, value: values.join('|') };
  model.setState({
    filters: [...model.state.filters.filter((f) => f.key !== filter.key), newFilter],
  });
};

export const excludeFromFilter = (model: FiltersVariable, filter: AdHocVariableFilter) => {
  const { done, found } = includeExcludeValue('!~', model, filter);
  if (done || !found) {
    return;
  }

  // we're handling operators that are not compatible

  if (found.operator !== '=~') {
    // replace the existing filter
    const newFilter = { ...found, operator: '!~', value: filter.value };
    model.setState({
      filters: [...model.state.filters.filter((f) => f.key !== filter.key), newFilter],
    });
    return;
  }

  // we're handling a filter with a regex or an "in" operator

  // is it a filter with a regex?
  if (REGEX_CHARS_REGEX.test(found.value)) {
    // we replace the existing filter with a new filter
    const newFilter = { ...found, operator: '!~', value: filter.value };
    model.setState({
      filters: [...model.state.filters.filter((f) => f.key !== filter.key), newFilter],
    });
    return;
  }

  // we're handling a filter with an "in" operator
  let values = found.value.split('|');

  // does it already contain the value to exclude?
  if (!values.includes(filter.value)) {
    // no, nothing to do
    return;
  }

  // yes, we remove it from the filter values
  values = values.filter((v) => v !== filter.value);

  if (!values.length) {
    // we remove the existing filter
    model.setState({
      filters: [...model.state.filters.filter((f) => f.key !== filter.key)],
    });
    return;
  }

  // we remove the value from the existing filter
  const newFilter = { ...found, value: values.join('|') };
  model.setState({
    filters: [...model.state.filters.filter((f) => f.key !== filter.key), newFilter],
  });
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
