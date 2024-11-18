import { logger } from '@shared/infrastructure/tracking/logger';

import plugin from '../../plugin.json';

class UserStorage {
  #storage: Storage = window.localStorage;

  KEYS = {
    SETTINGS: `${plugin.id}.userSettings`,
    GITHUB_INTEGRATION: `${plugin.id}.gitHubIntegration`,
    PROFILES_EXPLORER: `${plugin.id}.profilesExplorer`,
  };

  has(itemName: string): boolean {
    return this.#storage.hasOwnProperty(itemName);
  }

  get(itemName: string): null | any {
    if (!this.has(itemName)) {
      return null;
    }

    try {
      return JSON.parse(this.#storage.getItem(itemName) as string);
    } catch (error) {
      logger.error(error as Error, { info: `Error parsing JSON for storage item "${itemName}"!` });
      return null;
    }
  }

  set(itemName: string, value: any): void {
    try {
      this.#storage.setItem(itemName, JSON.stringify(value));
    } catch (error) {
      logger.error(error as Error, { info: `Error setting storage item "${itemName}"!` });
    }
  }
}

export const userStorage = new UserStorage();
