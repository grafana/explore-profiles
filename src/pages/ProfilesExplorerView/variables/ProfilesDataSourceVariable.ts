import { DataSourceVariable } from '@grafana/scenes';

export class ProfilesDataSourceVariable extends DataSourceVariable {
  constructor() {
    super({
      pluginId: 'grafana-pyroscope-datasource',
      name: 'dataSource',
      label: 'Data source',
    });
  }
}
