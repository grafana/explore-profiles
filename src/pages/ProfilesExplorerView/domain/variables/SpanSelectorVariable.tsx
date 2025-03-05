import { QueryVariable } from '@grafana/scenes';

import { PYROSCOPE_FAVORITES_DATA_SOURCE } from '../../infrastructure/pyroscope-data-sources';

export class SpanSelectorVariable extends QueryVariable {
  constructor() {
    super({
      name: 'spanSelector',
      label: 'Span selector',
      datasource: PYROSCOPE_FAVORITES_DATA_SOURCE,
      // "hack": we want to subscribe to changes of dataSource, serviceName, profileMetricId and filters
      query: '$dataSource and $profileMetricId{service_name="$serviceName"} {filters="$filters"}',
    });
  }
}
