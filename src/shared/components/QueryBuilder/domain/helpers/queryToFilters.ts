import { nanoid } from 'nanoid';

import { FilterKind, Filters, OperatorKind } from '../types';
import { buildIsEmptyFilter } from './buildIsEmptyFilter';

const parseRawFilters = (rawFilters: string): string[][] => {
  const matches = rawFilters.matchAll(/(\w+)(=|!=|=~|!~)"([^"]*)"/g);
  return Array.from(matches).map(([, attribute, operator, value]) => [attribute, operator, value]);
};

const LABELS_REGEX = /.+:[^{]+\{(.+)\}$/;
const REGEX_CHARS_REGEX = /.*(\^|\$|\*|\+|\{|\}|\?).*/;

// eslint-disable-next-line sonarjs/cognitive-complexity
export function queryToFilters(query: string): Filters {
  // 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ebpf/gcp-logs-ops/grafana-agent", namespace="gcp-logs-ops"}'
  if (!query) {
    return [];
  }

  const rawLabels = query.match(LABELS_REGEX);
  // [_, 'service_name="ebpf/gcp-logs-ops/grafana-agent", namespace="gcp-logs-ops"']
  if (!rawLabels) {
    return [];
  }

  const rawFilters = parseRawFilters(rawLabels[1]);

  // [[service_name, =, ebpf/gcp-logs-ops/grafana-agent], [namespace, =, gcp-logs-ops]]

  return (rawFilters as string[][])
    .filter(([attribute]) => attribute !== 'service_name')
    .map(([attribute, operator, value]) => {
      const filter = {
        id: nanoid(10),
        type: FilterKind['attribute-operator-value'],
        active: true,
        attribute: { value: attribute, label: attribute },
        operator: { value: operator, label: operator },
        value: { value: value, label: value },
      };

      const shouldConvertToIsEmptyOperator = operator === OperatorKind['='] && value === '';
      if (shouldConvertToIsEmptyOperator) {
        return buildIsEmptyFilter(filter);
      }

      const shouldConvertToInNotInOperator =
        [OperatorKind['=~'], OperatorKind['!~']].includes(operator as OperatorKind) && !REGEX_CHARS_REGEX.test(value);

      if (shouldConvertToInNotInOperator) {
        return {
          ...filter,
          operator:
            operator === OperatorKind['=~']
              ? { value: OperatorKind.in, label: 'in' }
              : { value: OperatorKind['not-in'], label: 'not in' },
          value: {
            value: value,
            label: value
              .split('|')
              .map((v) => v.trim())
              .join(', '),
          },
        };
      }

      return filter;
    });
}
