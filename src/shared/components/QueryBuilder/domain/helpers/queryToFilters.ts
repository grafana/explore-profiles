import { nanoid } from 'nanoid';

import { FilterKind, Filters, IsEmptyFilter, OperatorKind } from '../types';

export const parseRawFilters = (rawFilters: string): string[][] => {
  const matches = rawFilters.matchAll(/(\w+)(=|!=|=~|!~)"([^"]*)"/g);
  return Array.from(matches).map(([, attribute, operator, value]) => [attribute, operator, value]);
};

// eslint-disable-next-line sonarjs/cognitive-complexity
export function queryToFilters(query: string): Filters {
  // 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ebpf/gcp-logs-ops/grafana-agent", namespace="gcp-logs-ops"}'
  if (!query) {
    return [];
  }

  const rawLabels = query.match(/.+:.+\{(.+)\}/);
  // [_, 'service_name="ebpf/gcp-logs-ops/grafana-agent", namespace="gcp-logs-ops"']
  if (!rawLabels) {
    return [];
  }

  const rawFilters = parseRawFilters(rawLabels[1]);

  // [[service_name, =, ebpf/gcp-logs-ops/grafana-agent], [namespace, =, gcp-logs-ops]]

  return (rawFilters as string[][])
    .filter(([attribute]) => attribute !== 'service_name')
    .map(([attribute, operator, value]) => {
      const shouldChangeToIsEmptyOperator = operator === OperatorKind['='] && value === '';
      if (shouldChangeToIsEmptyOperator) {
        return {
          id: nanoid(10),
          active: true,
          attribute: { value: attribute, label: attribute },
          ...IsEmptyFilter,
        };
      }

      // TODO: uncomment when we'll support the "in" operator
      // const shouldChangeToInOperator = operator === OperatorKind['=~'] && value.includes('|');
      // if (shouldChangeToInOperator) {
      //   return {
      //     id: nanoid(10),
      //     type: FilterKind['attribute-operator-value'],
      //     active: true,
      //     attribute: { value: attribute, label: attribute },
      //     operator: { value: OperatorKind.in, label: OperatorKind.in },
      //     value: {
      //       value: value,
      //       label: value
      //         .split('|')
      //         .map((v) => v.trim())
      //         .join(', '),
      //     },
      //   };
      // }

      return {
        id: nanoid(10),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: { value: attribute, label: attribute },
        operator: { value: operator, label: operator },
        value: { value: value, label: value },
      };
    });
}
