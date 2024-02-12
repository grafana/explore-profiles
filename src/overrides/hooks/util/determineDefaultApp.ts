import { userStorage } from '@shared/infrastructure/userStorage';
import { determineDefaultApp as pyroscopeDetermineDefaultApp } from 'grafana-pyroscope/public/app/hooks/util/determineDefaultApp';

export async function determineDefaultApp(apps: any[]) {
  const userSettings = userStorage.get(userStorage.KEYS.SETTINGS);

  if (userSettings?.defaultApp) {
    const filteredApps = apps.filter(({ name }) => name === userSettings.defaultApp);

    if (filteredApps.length > 0) {
      return pyroscopeDetermineDefaultApp(filteredApps);
    }
  }

  return pyroscopeDetermineDefaultApp(apps);
}
