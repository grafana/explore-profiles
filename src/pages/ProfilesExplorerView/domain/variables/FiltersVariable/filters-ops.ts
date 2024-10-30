import { AdHocVariableFilter } from '@grafana/data';
import { isRegexOperator } from '@shared/components/QueryBuilder/domain/helpers/isRegexOperator';
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

export function includeLabelValue(
  filters: AdHocVariableFilter[],
  filterForInclude: AdHocVariableFilter
): AdHocVariableFilter[] {
  const found = filters.find((f) => f.key === filterForInclude.key);

  if (!found) {
    return [...filters, { ...filterForInclude, operator: '=~' }];
  }

  if (!isRegexOperator(found.operator)) {
    return [...filters.filter((f) => f.key !== filterForInclude.key), { ...filterForInclude, operator: '=~' }];
  }

  const foundValues = found.value.split('|');

  if (found.operator === '=~') {
    if (foundValues.includes(filterForInclude.value)) {
      return filters;
    }

    return [
      ...filters.filter((f) => f.key !== filterForInclude.key),
      { ...found, value: `${found.value}|${filterForInclude.value}` },
    ];
  }

  // found.operator is '!~'
  if (!foundValues.includes(filterForInclude.value)) {
    return filters;
  }

  const filteredValues = foundValues.filter((v) => v !== filterForInclude.value);

  if (filteredValues.length > 0) {
    return [...filters.filter((f) => f.key !== filterForInclude.key), { ...found, value: filteredValues.join('|') }];
  }

  return [...filters.filter((f) => f.key !== filterForInclude.key)];
}

export function excludeLabelValue(
  filters: AdHocVariableFilter[],
  filterForExclude: AdHocVariableFilter
): AdHocVariableFilter[] {
  const found = filters.find((f) => f.key === filterForExclude.key);

  if (!found) {
    return [...filters, { ...filterForExclude, operator: '!~' }];
  }

  if (!isRegexOperator(found.operator)) {
    return [...filters.filter((f) => f.key !== filterForExclude.key), { ...filterForExclude, operator: '!~' }];
  }

  const foundValues = found.value.split('|');

  if (found.operator === '!~') {
    if (foundValues.includes(filterForExclude.value)) {
      return filters;
    }

    return [
      ...filters.filter((f) => f.key !== filterForExclude.key),
      { ...found, value: `${found.value}|${filterForExclude.value}` },
    ];
  }

  // found.operator is '=~'
  if (!foundValues.includes(filterForExclude.value)) {
    return filters;
  }

  const filteredValues = foundValues.filter((v) => v !== filterForExclude.value);

  if (filteredValues.length > 0) {
    return [...filters.filter((f) => f.key !== filterForExclude.key), { ...found, value: filteredValues.join('|') }];
  }

  return [...filters.filter((f) => f.key !== filterForExclude.key)];
}

export function clearLabelValue(
  filters: AdHocVariableFilter[],
  filterForClear: AdHocVariableFilter
): AdHocVariableFilter[] {
  const found = filters.find((f) => f.key === filterForClear.key && isRegexOperator(f.operator));

  if (!found) {
    return filters;
  }

  const filteredValues = found.value.split('|').filter((v) => v !== filterForClear.value);

  if (filteredValues.length > 0) {
    return [...filters.filter((f) => f.key !== filterForClear.key), { ...found, value: filteredValues.join('|') }];
  }

  return [...filters.filter((f) => f.key !== filterForClear.key)];
}
