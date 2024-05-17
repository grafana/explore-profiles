import { DataSourceVariable } from '@grafana/scenes';

export class ProfilesDataSourceVariable extends DataSourceVariable {
  constructor(options: any) {
    super({
      ...options,
      pluginId: 'phlare',
      name: 'dataSource',
      label: 'Data source',
    });
  }
}
