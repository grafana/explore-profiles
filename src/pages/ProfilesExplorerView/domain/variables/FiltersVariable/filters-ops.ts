import { AdHocVariableFilter } from '@grafana/data';
import { CompleteFilter, OperatorKind } from '@shared/components/QueryBuilder/domain/types';

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

function searchForFilter(filters: AdHocVariableFilter[], filterKey: string) {
  let found: AdHocVariableFilter | undefined;

  const filtersWithoutFound = filters.filter((f) => {
    if (f.key === filterKey) {
      found = f;
      return false;
    }

    return true;
  });

  return { found, filtersWithoutFound };
}

const addToFilters = (filters: AdHocVariableFilter[], filterToAdd: AdHocVariableFilter) => [...filters, filterToAdd];

export function includeLabelValue(
  filters: AdHocVariableFilter[],
  filterForInclude: AdHocVariableFilter
): AdHocVariableFilter[] {
  const { found, filtersWithoutFound } = searchForFilter(filters, filterForInclude.key);

  if (!found) {
    return addToFilters(filters, { ...filterForInclude, operator: '=~' });
  }

  if (['!~', '!='].includes(found.operator)) {
    return addToFilters(filtersWithoutFound, { ...filterForInclude, operator: '=~' });
  }

  const foundValues = new Set(found.value.split('|'));

  if (found.operator === '=~') {
    return addToFilters(filtersWithoutFound, {
      ...found,
      value: Array.from(foundValues.add(filterForInclude.value)).join('|'),
    });
  }

  // found.operator is '='
  return found.value === filterForInclude.value
    ? filters
    : addToFilters(filtersWithoutFound, {
        ...filterForInclude,
        operator: '=~',
        value: Array.from(foundValues.add(filterForInclude.value)).join('|'),
      });
}

export function excludeLabelValue(
  filters: AdHocVariableFilter[],
  filterForExclude: AdHocVariableFilter
): AdHocVariableFilter[] {
  const { found, filtersWithoutFound } = searchForFilter(filters, filterForExclude.key);

  if (!found) {
    return addToFilters(filters, { ...filterForExclude, operator: '!~' });
  }

  if (['=~', '='].includes(found.operator)) {
    return addToFilters(filtersWithoutFound, { ...filterForExclude, operator: '!~' });
  }

  const foundValues = new Set(found.value.split('|'));

  if (found.operator === '!~') {
    return addToFilters(filtersWithoutFound, {
      ...found,
      value: Array.from(foundValues.add(filterForExclude.value)).join('|'),
    });
  }

  // found.operator is '!='
  return found.value === filterForExclude.value
    ? filters
    : addToFilters(filtersWithoutFound, {
        ...filterForExclude,
        operator: '!~',
        value: Array.from(foundValues.add(filterForExclude.value)).join('|'),
      });
}

export function clearLabelValue(
  filters: AdHocVariableFilter[],
  filterForClear: AdHocVariableFilter
): AdHocVariableFilter[] {
  const { found, filtersWithoutFound } = searchForFilter(filters, filterForClear.key);

  if (!found) {
    return filters;
  }

  const filteredValues = found.value.split('|').filter((v) => v !== filterForClear.value);

  if (filteredValues.length > 0) {
    return addToFilters(filtersWithoutFound, {
      ...found,
      value: filteredValues.join('|'),
    });
  }

  return [...filtersWithoutFound];
}

export const isFilterValid = (filter: AdHocVariableFilter) => filter.operator in OperatorKind;
