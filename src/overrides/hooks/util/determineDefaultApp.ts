import { determineDefaultApp as pyroscopeDetermineDefaultApp } from 'grafana-pyroscope/public/app/hooks/util/determineDefaultApp';

import userStorage from '../../../shared/infrastructure/UserStorage';

export async function determineDefaultApp(apps: any[]) {
  const userSettings = await userStorage.get(userStorage.KEYS.SETTINGS);

  if (userSettings?.defaultApp) {
    const filteredApps = apps.filter(({ name }) => name === userSettings.defaultApp);

    if (filteredApps.length > 0) {
      return pyroscopeDetermineDefaultApp(filteredApps);
    }
  }

  return pyroscopeDetermineDefaultApp(apps);
}
