import { DataSourceVariable } from '@grafana/scenes';

export class ProfilesDataSourceVariable extends DataSourceVariable {
  constructor() {
    super({
      pluginId: 'phlare',
      name: 'dataSource',
      label: 'Data source',
    });
  }
}
