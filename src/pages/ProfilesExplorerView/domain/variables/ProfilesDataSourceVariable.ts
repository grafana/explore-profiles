import { DataSourceVariable } from '@grafana/scenes';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { userStorage } from '@shared/infrastructure/userStorage';

export class ProfilesDataSourceVariable extends DataSourceVariable {
  constructor({ initialDS }: { initialDS?: string }) {
    super({
      pluginId: 'grafana-pyroscope-datasource',
      key: 'dataSource',
      name: 'dataSource',
      label: 'Data source',
      skipUrlSync: true,
      // we ensure that we'll always have the expected default data source (when the "var-dataSource" URL search param is missing, incorrect, etc.)
      value: initialDS ?? ApiClient.selectDefaultDataSource().uid,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    this.setState({ skipUrlSync: false });

    this.subscribeToState((newState, prevState) => {
      if (newState.value && newState.value !== prevState.value) {
        const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
        storage.dataSource = newState.value;
        userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
      }
    });
  }
}
