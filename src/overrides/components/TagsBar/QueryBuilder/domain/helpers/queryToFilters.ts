import { nanoid } from 'nanoid';
import { FilterKind, Filters, OperatorKind } from '../types';

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

  const rawFilters = rawLabels[1].split(',').map((m) => m.match(/\W*([^=!~]+)(=|!=|=~|!~)"(.*)"/));
  // [[_, service_name, =, ebpf/gcp-logs-ops/grafana-agent] [_, namespace, =, gcp-logs-ops]] or [null, null]
  if (rawFilters.some((m) => m === null)) {
    // let's be strict on parsing
    return [];
  }

  return (rawFilters as string[][])
    .filter(([, attribute]) => attribute !== 'service_name')
    .map(([, attribute, operator, value]) => {
      const shouldChangeToIsEmptyOperator = operator === OperatorKind['='] && value === '';
      if (shouldChangeToIsEmptyOperator) {
        return {
          id: nanoid(10),
          type: FilterKind['attribute-operator-value'],
          active: true,
          attribute: { value: attribute, label: attribute },
          // TODO: don't hardcode the label
          operator: { value: OperatorKind['is-empty'], label: 'is empty' },
          value: {
            value: '',
            label: '',
          },
        };
      }

      const shouldChangeToInOperator = operator === OperatorKind['=~'] && value.includes('|');
      if (shouldChangeToInOperator) {
        return {
          id: nanoid(10),
          type: FilterKind['attribute-operator-value'],
          active: true,
          attribute: { value: attribute, label: attribute },
          operator: { value: OperatorKind.in, label: OperatorKind.in },
          value: {
            value: value,
            label: value
              .split('|')
              .map((v) => v.trim())
              .join(', '),
          },
        };
      }

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
