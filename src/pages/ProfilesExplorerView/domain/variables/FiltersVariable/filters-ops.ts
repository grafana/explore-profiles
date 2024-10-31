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

// eslint-disable-next-line sonarjs/cognitive-complexity
export function includeLabelValue(
  filters: AdHocVariableFilter[],
  filterForInclude: AdHocVariableFilter
): AdHocVariableFilter[] {
  const found = filters.find((f) => f.key === filterForInclude.key);
  if (!found) {
    return [...filters, { ...filterForInclude, operator: '=~' }];
  }

  const foundValues = new Set(found.value.split('|'));

  if (!isRegexOperator(found.operator)) {
    if (found.operator === '!=') {
      return found.value === filterForInclude.value
        ? [...filters.filter((f) => f.key !== filterForInclude.key), { ...filterForInclude, operator: '=~' }]
        : filters;
    }

    // found.operator is '='
    return found.value === filterForInclude.value
      ? filters
      : [
          ...filters.filter((f) => f.key !== filterForInclude.key),
          {
            ...filterForInclude,
            operator: '=~',
            value: Array.from(foundValues.add(filterForInclude.value)).join('|'),
          },
        ];
  }

  if (found.operator === '=~') {
    foundValues.add(filterForInclude.value);

    return [
      ...filters.filter((f) => f.key !== filterForInclude.key),
      { ...found, value: Array.from(foundValues).join('|') },
    ];
  }

  // found.operator is '!~'
  return [...filters.filter((f) => f.key !== filterForInclude.key), { ...filterForInclude, operator: '=~' }];
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function excludeLabelValue(
  filters: AdHocVariableFilter[],
  filterForExclude: AdHocVariableFilter
): AdHocVariableFilter[] {
  const found = filters.find((f) => f.key === filterForExclude.key);
  if (!found) {
    return [...filters, { ...filterForExclude, operator: '!~' }];
  }

  const foundValues = new Set(found.value.split('|'));

  if (!isRegexOperator(found.operator)) {
    if (found.operator === '=') {
      return found.value === filterForExclude.value
        ? [...filters.filter((f) => f.key !== filterForExclude.key)]
        : filters;
    }

    // found.operator is '!='
    return found.value === filterForExclude.value
      ? filters
      : [
          ...filters.filter((f) => f.key !== filterForExclude.key),
          {
            ...filterForExclude,
            operator: '!~',
            value: Array.from(foundValues.add(filterForExclude.value)).join('|'),
          },
        ];
  }

  if (found.operator === '!~') {
    return [
      ...filters.filter((f) => f.key !== filterForExclude.key),
      {
        ...found,
        value: Array.from(foundValues.add(filterForExclude.value)).join('|'),
      },
    ];
  }

  // found.operator is '=~'
  if (!foundValues.has(filterForExclude.value)) {
    return filters;
  }

  const filteredValues = found.value.split('|').filter((v) => v !== filterForExclude.value);

  if (filteredValues.length > 0) {
    return [
      ...filters.filter((f) => f.key !== filterForExclude.key),
      {
        ...found,
        value: filteredValues.join('|'),
      },
    ];
  }

  return [...filters.filter((f) => f.key !== filterForExclude.key)];
}

export function clearLabelValue(
  filters: AdHocVariableFilter[],
  filterForClear: AdHocVariableFilter
): AdHocVariableFilter[] {
  const found = filters.find((f) => f.key === filterForClear.key);

  if (!found) {
    return filters;
  }

  const filteredValues = found.value.split('|').filter((v) => v !== filterForClear.value);

  if (filteredValues.length > 0) {
    return [
      ...filters.filter((f) => f.key !== filterForClear.key),
      {
        ...found,
        value: filteredValues.join('|'),
      },
    ];
  }

  return [...filters.filter((f) => f.key !== filterForClear.key)];
}
