import { nanoid } from 'nanoid';
import { FilterKind, Filters, OperatorKind } from '../types';

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

  const rawFilters = rawLabels[1].split(',').map((m) => m.match(/\W*([^=!~]+)(=|!=|=~|!~)"(.+)"/));
  // [[_, service_name, =, ebpf/gcp-logs-ops/grafana-agent] [_, namespace, =, gcp-logs-ops]] or [null, null]
  if (rawFilters.some((m) => m === null)) {
    // let's be strict on parsing
    return [];
  }

  return (rawFilters as string[][])
    .filter(([, attribute]) => attribute !== 'service_name')
    .map(([, attribute, operator, value]) => {
      const shouldChangeToInOperator = OperatorKind['=~'] && value.includes('|');

      return shouldChangeToInOperator
        ? {
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
          }
        : {
            id: nanoid(10),
            type: FilterKind['attribute-operator-value'],
            active: true,
            attribute: { value: attribute, label: attribute },
            operator: { value: operator, label: operator },
            value: { value: value, label: value },
          };
    });
}
