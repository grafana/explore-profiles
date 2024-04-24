import { DataSourceVariable } from '@grafana/scenes';
import { userStorage } from '@shared/infrastructure/userStorage';

export class ProfilesDataSourceVariable extends DataSourceVariable {
  constructor(options: any) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};

    super({
      ...options,
      pluginId: 'phlare',
      name: 'dataSource',
      label: 'Data source',
      value: storage.dataSource,
    });

    this.subscribeToState((newState) => {
      if (newState.value) {
        storage.dataSource = newState.value.toString();
        userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
      }
    });
  }
}
