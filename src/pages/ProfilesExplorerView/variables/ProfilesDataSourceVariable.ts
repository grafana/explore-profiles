import { DataSourceVariable } from '@grafana/scenes';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';

export class ProfilesDataSourceVariable extends DataSourceVariable {
  constructor() {
    super({
      pluginId: 'grafana-pyroscope-datasource',
      name: 'dataSource',
      label: 'Data source',
      skipUrlSync: true,
      // we ensure that we'll always have the expected default data source (when the "var-dataSource" URL search param is missing, incorrect, etc.)
      value: ApiClient.selectDefaultDataSource().uid,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    this.setState({ skipUrlSync: false });
  }
}
